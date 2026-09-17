import { z } from 'zod';
const boolString = z.enum(['true','false']).default('true').transform(v=>v==='true');
const optionalTopic = z.preprocess(
  value => value === '' ? undefined : value,
  z.string().regex(/^projects\/[^/]+\/topics\/[^/]+$/).optional(),
);
const optionalUrl = z.preprocess(
  value => value === '' ? undefined : value,
  z.url().optional(),
);
const optionalEmail = z.preprocess(
  value => value === '' ? undefined : value,
  z.email().optional(),
);
const schema = z.object({
  NODE_ENV:z.enum(['development','test','production']).default('development'),
  PORT:z.coerce.number().int().min(1).max(65535).default(3000),
  APP_URL:z.url().default('http://localhost:5173'),
  DATABASE_URL:z.string().min(1), REDIS_URL:z.string().min(1),
  JWT_SECRET:z.string().min(32), ENCRYPTION_KEY:z.string().min(43),
  GOOGLE_CLIENT_ID:z.string().min(1), GOOGLE_CLIENT_SECRET:z.string().min(1), GOOGLE_REDIRECT_URI:z.url(),
GMAIL_PUBSUB_TOPIC:optionalTopic,
GMAIL_PUBSUB_AUDIENCE:optionalUrl,
GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL:optionalEmail,
  AI_PROVIDER:z.enum(['mock','openai','anthropic']).default('mock'),
  OPENAI_API_KEY:z.string().optional(), OPENAI_BASE_URL:z.url().default('https://api.openai.com/v1'), OPENAI_MODEL:z.string().default('gpt-4.1-mini'),
  ANTHROPIC_API_KEY:z.string().optional(), ANTHROPIC_MODEL:z.string().default('claude-sonnet-4-5'),
  AUTO_SEND_GLOBAL_KILL_SWITCH:boolString, LOG_LEVEL:z.string().default('info'),
}).superRefine((value,context)=>{
  const pushValues=[value.GMAIL_PUBSUB_TOPIC,value.GMAIL_PUBSUB_AUDIENCE,value.GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL];
  const configured=pushValues.filter(item=>item!==undefined).length;
  if(configured!==0&&configured!==pushValues.length){
    context.addIssue({code:'custom',path:['GMAIL_PUBSUB_TOPIC'],message:'Gmail Pub/Sub topic, audience, and service-account email must be configured together'});
  }
});
export type AppConfig=z.infer<typeof schema>;
export function loadConfig(source:Record<string,string|undefined>=process.env):AppConfig { return schema.parse(source); }
