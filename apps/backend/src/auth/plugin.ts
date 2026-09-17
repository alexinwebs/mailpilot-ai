import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { hashToken } from '../security.js';
import type { AuthClaims } from '../types.js';
export default fp(async app=>{await app.register(cookie);await app.register(jwt,{secret:app.services.config.JWT_SECRET,cookie:{cookieName:'mailpilot_session',signed:false},sign:{expiresIn:'15m'}});app.decorate('authenticate',async(request,reply)=>{try{const claims=await request.jwtVerify<AuthClaims>();const session=await app.services.prisma.session.findFirst({where:{id:claims.sid,userId:claims.sub,revokedAt:null,expiresAt:{gt:new Date()},tokenHash:hashToken(request.cookies.mailpilot_session??'')}});if(!session)throw new Error('Session revoked');request.authUser=claims;}catch{await reply.code(401).send({ok:false,error:{code:'UNAUTHORIZED',message:'Authentication required'}});}});});
