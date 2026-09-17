import type { PrismaClient } from '../generated/prisma/client.js';
import type { AppConfig } from '@mailpilot/config';
import { authenticatedGmail } from '../email/gmail.js';
import { createHash } from 'node:crypto';
import { audit } from '../audit.js';
const encode=(value:string):string=>Buffer.from(value).toString('base64url');
export async function sendDraft(prisma:PrismaClient,config:AppConfig,draftId:string,userId:string):Promise<string>{
  if(config.AUTO_SEND_GLOBAL_KILL_SWITCH)throw new Error('Global send kill switch is active');
  const draft=await prisma.replyDraft.findFirstOrThrow({where:{id:draftId,thread:{userId}},include:{thread:{include:{account:{include:{credential:true}},messages:{orderBy:{sentAt:'desc'},take:1}}}}});
  if(!['APPROVED','SENDING'].includes(draft.status))throw new Error('Draft is not approved');
  if(!draft.thread.account.credential)throw new Error('OAuth credential missing');
  const latest=draft.thread.messages[0];if(!latest)throw new Error('Thread has no message');
  const sendKey=createHash('sha256').update(`${draft.id}:${draft.version}`).digest('hex');
  const internetMessageId=`<mailpilot-${draft.id}-${draft.version}@mailpilot.local>`;
  const existing=await prisma.sendAttempt.findUnique({where:{sendKey}});
  if(existing?.status==='SENT'&&existing.providerMessageId)return existing.providerMessageId;
  await prisma.$transaction(async tx=>{await tx.sendAttempt.upsert({where:{sendKey},create:{draftId,sendKey,status:'RESERVED',internetMessageId},update:{attemptCount:{increment:1}}});await tx.replyDraft.updateMany({where:{id:draftId,status:'APPROVED'},data:{status:'SENDING'}});});
  const gmail=authenticatedGmail(config,draft.thread.account.credential);
  const headers=[`From: ${draft.thread.account.email}`,`To: ${latest.fromAddress}`,`Subject: ${draft.subject}`,`In-Reply-To: ${latest.internetMessageId??''}`,`References: ${latest.internetMessageId??''}`,`Message-ID: ${internetMessageId}`,'Content-Type: text/plain; charset=utf-8','MIME-Version: 1.0'];
  try{const result=await gmail.users.messages.send({userId:'me',requestBody:{threadId:draft.thread.providerThreadId,raw:encode(`${headers.join('\r\n')}\r\n\r\n${draft.bodyText}`)}});if(!result.data.id)throw new Error('Gmail send returned no message ID');await prisma.$transaction([prisma.sendAttempt.update({where:{sendKey},data:{status:'SENT',providerMessageId:result.data.id,sentAt:new Date()}}),prisma.replyDraft.update({where:{id:draftId},data:{status:'SENT'}})]);await audit(prisma,{userId,action:'EMAIL_SENT',resourceType:'REPLY_DRAFT',resourceId:draftId,outcome:'SUCCESS',metadata:{provider:'gmail'}});return result.data.id;}
  catch(error){await prisma.$transaction([prisma.sendAttempt.update({where:{sendKey},data:{status:'FAILED',errorCode:error instanceof Error?error.name:'UNKNOWN'}}),prisma.replyDraft.update({where:{id:draftId},data:{status:'FAILED'}})]);await audit(prisma,{userId,action:'EMAIL_SEND_FAILED',resourceType:'REPLY_DRAFT',resourceId:draftId,outcome:'FAILURE'});throw error;}
}
