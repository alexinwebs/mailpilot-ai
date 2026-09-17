import { loadConfig } from '@mailpilot/config';
import { createPrisma } from './db.js';
import { buildApp } from './app.js';
import { createQueues,createWorkers } from './jobs/queues.js';
const config=loadConfig();const prisma=createPrisma(config.DATABASE_URL);const queues=createQueues(config);const workers=createWorkers(config,prisma,queues);const app=await buildApp({prisma,config,...queues});let stopping=false;async function shutdown(signal:string){if(stopping)return;stopping=true;app.log.info({signal},'graceful shutdown');await Promise.all(workers.map(w=>w.close()));await Promise.all([queues.syncQueue.close(),queues.pipelineQueue.close(),queues.sendQueue.close()]);await app.close();await prisma.$disconnect();}for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{void shutdown(signal).finally(()=>process.exit(0));});await app.listen({host:'0.0.0.0',port:config.PORT});
