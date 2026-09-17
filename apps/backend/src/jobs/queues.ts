import { Queue,Worker,type ConnectionOptions } from 'bullmq';
import type { AppConfig } from '@mailpilot/config';
import type { PrismaClient } from '../generated/prisma/client.js';
import { syncAccount } from '../services/ingest.js';
import { processThread } from '../services/pipeline.js';
import { sendDraft } from '../services/send.js';
import {
  configureGmailWatch,
  renewExpiringGmailWatches,
} from '../email/gmail-watch.js';
import { z } from 'zod';

const accountJobSchema=z.object({accountId:z.uuid(),userId:z.uuid()});
const threadJobSchema=z.object({threadId:z.uuid(),userId:z.uuid()});
const draftJobSchema=z.object({draftId:z.uuid(),userId:z.uuid()});
function connection(config:AppConfig):ConnectionOptions {const url=new URL(config.REDIS_URL);return {host:url.hostname,port:Number(url.port||6379),username:url.username||undefined,password:url.password||undefined,tls:url.protocol==='rediss:'?{}:undefined};}
export function createQueues(config:AppConfig){const c=connection(config);return {syncQueue:new Queue('mail-sync',{connection:c,defaultJobOptions:{removeOnComplete:1000,removeOnFail:500}}),pipelineQueue:new Queue('ai-pipeline',{connection:c,defaultJobOptions:{removeOnComplete:1000,removeOnFail:500}}),sendQueue:new Queue('email-send',{connection:c,defaultJobOptions:{removeOnComplete:1000,removeOnFail:500}})};}
export function createWorkers(config:AppConfig,prisma:PrismaClient,queues:ReturnType<typeof createQueues>):Worker[]{const c=connection(config);return [new Worker('mail-sync',async job=>{if(job.name==='renew-gmail-watches')return renewExpiringGmailWatches(prisma,config);const data=accountJobSchema.parse(job.data);if(job.name==='watch-account')return configureGmailWatch(prisma,config,data.accountId,data.userId);return syncAccount(prisma,config,queues.pipelineQueue,data.accountId,data.userId);},{connection:c,concurrency:2}),new Worker('ai-pipeline',async job=>{const data=threadJobSchema.parse(job.data);await processThread(prisma,config,queues.sendQueue,data.threadId,data.userId);},{connection:c,concurrency:3}),new Worker('email-send',async job=>{const data=draftJobSchema.parse(job.data);return sendDraft(prisma,config,data.draftId,data.userId);},{connection:c,concurrency:1,limiter:{max:10,duration:60_000}})];}
