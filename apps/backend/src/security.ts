import { createCipheriv,createDecipheriv,createHash,randomBytes } from 'node:crypto';
export const hashToken=(value:string):string=>createHash('sha256').update(value).digest('hex');
export const hashBody=(value:string):string=>hashToken(value);
export function encryptSecret(value:string,base64Key:string):string { const key=Buffer.from(base64Key,'base64'); if(key.length!==32) throw new Error('ENCRYPTION_KEY must decode to 32 bytes'); const iv=randomBytes(12); const cipher=createCipheriv('aes-256-gcm',key,iv); const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]); return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64'); }
export function decryptSecret(payload:string,base64Key:string):string { const raw=Buffer.from(payload,'base64'); if(raw.length<29) throw new Error('Invalid encrypted value'); const key=Buffer.from(base64Key,'base64'); const decipher=createDecipheriv('aes-256-gcm',key,raw.subarray(0,12)); decipher.setAuthTag(raw.subarray(12,28)); return Buffer.concat([decipher.update(raw.subarray(28)),decipher.final()]).toString('utf8'); }
export const safeError=(error:unknown):string=>error instanceof Error?error.message:'Unknown error';
