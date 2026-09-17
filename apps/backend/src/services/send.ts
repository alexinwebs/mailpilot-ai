import type { PrismaClient } from '../generated/prisma/client.js';
import type { AppConfig } from '@mailpilot/config';
import { authenticatedGmail } from '../email/gmail.js';
import { createHash } from 'node:crypto';
import { audit } from '../audit.js';

const encode=(value:string):string=>Buffer.from(value).toString('base64url');
const SEND_LOCK_MS=30_000;

type GmailClient=ReturnType<typeof authenticatedGmail>;

export function createSendIdentity(draftId:string,version:number):{sendKey:string;internetMessageId:string}{
  return {
    sendKey:createHash('sha256').update(`${draftId}:${version}`).digest('hex'),
    internetMessageId:`<mailpilot-${draftId}-${version}@mailpilot.local>`,
  };
}

export function isSendLockStale(updatedAt:Date,now=Date.now()):boolean{
  return updatedAt.getTime()<=now-SEND_LOCK_MS;
}

async function findAcceptedMessage(gmail:GmailClient,internetMessageId:string):Promise<string|null>{
  const result=await gmail.users.messages.list({userId:'me',q:`rfc822msgid:${internetMessageId}`,maxResults:1});
  return result.data.messages?.[0]?.id??null;
}

async function markSent(prisma:PrismaClient,draftId:string,sendKey:string,providerMessageId:string):Promise<void>{
  await prisma.$transaction([
    prisma.sendAttempt.update({where:{sendKey},data:{status:'SENT',providerMessageId,sentAt:new Date(),errorCode:null}}),
    prisma.replyDraft.update({where:{id:draftId},data:{status:'SENT'}}),
  ]);
}

export async function sendDraft(prisma:PrismaClient,config:AppConfig,draftId:string,userId:string):Promise<string>{
  if(config.AUTO_SEND_GLOBAL_KILL_SWITCH)throw new Error('Global send kill switch is active');
  const draft=await prisma.replyDraft.findFirstOrThrow({where:{id:draftId,thread:{userId}},include:{thread:{include:{account:{include:{credential:true}},messages:{orderBy:{sentAt:'desc'},take:1}}}}});
  if(!['APPROVED','SENDING','FAILED'].includes(draft.status))throw new Error('Draft is not approved for sending');
  if(!draft.thread.account.credential)throw new Error('OAuth credential missing');
  const latest=draft.thread.messages[0];
  if(!latest)throw new Error('Thread has no message');

  const {sendKey,internetMessageId}=createSendIdentity(draft.id,draft.version);
  const gmail=authenticatedGmail(config,draft.thread.account.credential);
  const existing=await prisma.sendAttempt.findUnique({where:{sendKey}});
  if(existing?.status==='SENT'&&existing.providerMessageId)return existing.providerMessageId;

  if(existing){
    const accepted=await findAcceptedMessage(gmail,existing.internetMessageId);
    if(accepted){
      await markSent(prisma,draft.id,sendKey,accepted);
      await audit(prisma,{userId,action:'EMAIL_SEND_RECONCILED',resourceType:'REPLY_DRAFT',resourceId:draft.id,outcome:'SUCCESS',metadata:{provider:'gmail'}});
      return accepted;
    }
  }

  const claimed=await prisma.$transaction(async tx=>{
    if(draft.status==='SENDING'){
      if(!existing)return false;
      if(!isSendLockStale(existing.updatedAt))return false;
      const result=await tx.sendAttempt.updateMany({where:{sendKey,status:{in:['RESERVED','UNKNOWN','FAILED']},updatedAt:existing.updatedAt},data:{status:'RESERVED',attemptCount:{increment:1},reservedAt:new Date(),errorCode:null}});
      return result.count===1;
    }
    const transitioned=await tx.replyDraft.updateMany({where:{id:draft.id,status:{in:['APPROVED','FAILED']}},data:{status:'SENDING'}});
    if(transitioned.count!==1)return false;
    await tx.sendAttempt.upsert({where:{sendKey},create:{draftId,sendKey,status:'RESERVED',internetMessageId},update:{status:'RESERVED',attemptCount:{increment:1},reservedAt:new Date(),errorCode:null}});
    return true;
  });
  if(!claimed)throw new Error('A send attempt is already in progress');

  const headers=[`From: ${draft.thread.account.email}`,`To: ${latest.fromAddress}`,`Subject: ${draft.subject}`,`In-Reply-To: ${latest.internetMessageId??''}`,`References: ${latest.internetMessageId??''}`,`Message-ID: ${internetMessageId}`,'Content-Type: text/plain; charset=utf-8','MIME-Version: 1.0'];
  try{
    const result=await gmail.users.messages.send({userId:'me',requestBody:{threadId:draft.thread.providerThreadId,raw:encode(`${headers.join('\r\n')}\r\n\r\n${draft.bodyText}`)}});
    if(!result.data.id)throw new Error('Gmail send returned no message ID');
    await markSent(prisma,draft.id,sendKey,result.data.id);
    await audit(prisma,{userId,action:'EMAIL_SENT',resourceType:'REPLY_DRAFT',resourceId:draftId,outcome:'SUCCESS',metadata:{provider:'gmail'}});
    return result.data.id;
  }catch(error){
    let reconciled:string|null=null;
    try{reconciled=await findAcceptedMessage(gmail,internetMessageId);}catch(reconciliationError){await audit(prisma,{userId,action:'EMAIL_SEND_RECONCILIATION_FAILED',resourceType:'REPLY_DRAFT',resourceId:draftId,outcome:'FAILURE',metadata:{errorType:reconciliationError instanceof Error?reconciliationError.name:'UNKNOWN'}});}
    if(reconciled){
      await markSent(prisma,draft.id,sendKey,reconciled);
      await audit(prisma,{userId,action:'EMAIL_SEND_RECONCILED',resourceType:'REPLY_DRAFT',resourceId:draft.id,outcome:'SUCCESS',metadata:{provider:'gmail'}});
      return reconciled;
    }
    await prisma.sendAttempt.update({where:{sendKey},data:{status:'UNKNOWN',errorCode:error instanceof Error?error.name:'UNKNOWN'}});
    await audit(prisma,{userId,action:'EMAIL_SEND_UNCERTAIN',resourceType:'REPLY_DRAFT',resourceId:draftId,outcome:'FAILURE'});
    throw error;
  }
}
