import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
export function createPrisma(databaseUrl:string):PrismaClient { return new PrismaClient({adapter:new PrismaPg({connectionString:databaseUrl})}); }
