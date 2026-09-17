import type { PrismaClient } from './generated/prisma/client.js';
import type { AppConfig } from '@mailpilot/config';
import type { Queue } from 'bullmq';
import type { FastifyReply } from 'fastify';
export type JobQueue=Pick<Queue,'add'|'upsertJobScheduler'>;
export interface AppServices { prisma:PrismaClient; config:AppConfig; pipelineQueue:JobQueue; syncQueue:JobQueue; sendQueue:JobQueue; }
export interface AuthClaims { sub:string; sid:string; }
declare module 'fastify' { interface FastifyInstance { services:AppServices; authenticate:(request:FastifyRequest,reply:FastifyReply)=>Promise<void>; } interface FastifyRequest { authUser?:AuthClaims; } }
