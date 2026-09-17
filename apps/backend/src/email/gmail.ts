import { google } from 'googleapis';
import type { OAuthCredential } from '../generated/prisma/client.js';
import { decryptSecret,encryptSecret } from '../security.js';
import type { AppConfig } from '@mailpilot/config';
export function oauthClient(config:AppConfig){return new google.auth.OAuth2(config.GOOGLE_CLIENT_ID,config.GOOGLE_CLIENT_SECRET,config.GOOGLE_REDIRECT_URI);}
export function authorizationUrl(config:AppConfig,state:string):string{return oauthClient(config).generateAuthUrl({access_type:'offline',prompt:'consent',state,scope:['openid','email','https://www.googleapis.com/auth/gmail.modify','https://www.googleapis.com/auth/gmail.send']});}
export interface OAuthTokens { access_token?:string|null;refresh_token?:string|null;expiry_date?:number|null;scope?:string;token_type?:string|null;id_token?:string|null }
export async function exchangeCode(config:AppConfig,code:string):Promise<OAuthTokens>{const client=oauthClient(config);const result=await client.getToken(code);return result.tokens;}
export function authenticatedGmail(config:AppConfig,credential:OAuthCredential){const client=oauthClient(config);const credentials:{refresh_token:string;access_token?:string;expiry_date?:number}={refresh_token:decryptSecret(credential.refreshTokenEncrypted,config.ENCRYPTION_KEY)};if(credential.accessTokenEncrypted)credentials.access_token=decryptSecret(credential.accessTokenEncrypted,config.ENCRYPTION_KEY);if(credential.tokenExpiresAt)credentials.expiry_date=credential.tokenExpiresAt.getTime();client.setCredentials(credentials);return google.gmail({version:'v1',auth:client});}
export const encryptToken=(token:string,config:AppConfig):string=>encryptSecret(token,config.ENCRYPTION_KEY);
