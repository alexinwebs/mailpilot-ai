import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import authPlugin from './auth/plugin.js';
import { authRoutes } from './routes/auth.js';
import { gmailRoutes } from './routes/gmail.js';
import { gmailPushRoutes } from './routes/gmail-push.js';
import { appRoutes } from './routes/app.js';
import type { AppServices } from './types.js';
export async function buildApp(services:AppServices){
  const isProduction=services.config.NODE_ENV==='production';
  const webRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../../web/dist');
  const servesWeb=isProduction&&existsSync(webRoot);
  const app=Fastify({logger:{level:services.config.LOG_LEVEL,redact:['req.headers.authorization','req.headers.cookie','res.headers.set-cookie']},bodyLimit:1_000_000,trustProxy:isProduction});
  app.decorate('services',services);
  await app.register(helmet,isProduction?{}:{contentSecurityPolicy:false});
  await app.register(cors,{origin:services.config.APP_URL,credentials:true,methods:['GET','POST','PUT','DELETE']});
  await app.register(rateLimit,{max:120,timeWindow:'1 minute'});
  app.addHook('onRequest',async(request,reply)=>{
    if(!['POST','PUT','PATCH','DELETE'].includes(request.method)||request.url==='/v1/gmail/push')return;
    const origin=request.headers.origin;
    if(origin!==services.config.APP_URL){
      return reply.code(403).send({ok:false,error:{code:'INVALID_ORIGIN',message:'Request origin is not allowed'}});
    }
  });
  app.setErrorHandler((error,request,reply)=>{request.log.error({err:error},'request failed');if(error instanceof ZodError||isValidationError(error))return reply.code(400).send({ok:false,error:{code:'VALIDATION_ERROR',message:error.issues.map(i=>i.message).join('; ')}});if(isHttpError(error)&&error.statusCode<500)return reply.code(error.statusCode).send({ok:false,error:{code:'REQUEST_ERROR',message:error.message}});return reply.code(500).send({ok:false,error:{code:'INTERNAL_ERROR',message:'An internal error occurred'}});});
  await app.register(authPlugin);
  app.get('/health',async()=>({ok:true,data:{status:'up'}}));
  app.get('/ready',async(_request,reply)=>{try{await services.prisma.$queryRaw`SELECT 1`;return {ok:true,data:{status:'ready'}};}catch{return reply.code(503).send({ok:false,error:{code:'NOT_READY',message:'Database unavailable'}});}});
  await app.register(authRoutes,{prefix:'/v1/auth'});
  await app.register(gmailRoutes,{prefix:'/v1/gmail'});
  await app.register(gmailPushRoutes,{prefix:'/v1/gmail'});
  await app.register(appRoutes,{prefix:'/v1'});
  if(servesWeb){
    await app.register(fastifyStatic,{root:webRoot,prefix:'/'});
  }
  app.setNotFoundHandler((request,reply)=>{
    const acceptsHtml=request.headers.accept?.includes('text/html')??false;
    const isApiPath=request.url==='/health'||request.url==='/ready'||request.url.startsWith('/v1/');
    if(servesWeb&&!isApiPath&&request.method==='GET'&&acceptsHtml)return reply.sendFile('index.html');
    return reply.code(404).send({ok:false,error:{code:'NOT_FOUND',message:'Route not found'}});
  });
  return app;
}
function isHttpError(value:unknown):value is {statusCode:number;message:string}{return typeof value==='object'&&value!==null&&'statusCode'in value&&typeof value.statusCode==='number'&&'message'in value&&typeof value.message==='string';}
function isValidationError(value:unknown):value is {issues:{message:string}[]}{return typeof value==='object'&&value!==null&&'issues'in value&&Array.isArray(value.issues)&&value.issues.every(issue=>typeof issue==='object'&&issue!==null&&'message'in issue&&typeof issue.message==='string');}
