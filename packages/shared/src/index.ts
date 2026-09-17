import { z } from 'zod';

export const emailCategorySchema = z.enum(['PRIMARY','SUPPORT','SALES','BILLING','LEGAL','SECURITY','NEWSLETTER','SPAM','OTHER']);
export type EmailCategory = z.infer<typeof emailCategorySchema>;
export const policyOutcomeSchema = z.enum(['AUTO_SEND','HUMAN_REVIEW','BLOCK']);
export type PolicyOutcome = z.infer<typeof policyOutcomeSchema>;
export const riskSchema = z.enum(['LOW','MEDIUM','HIGH','CRITICAL']);
export type Risk = z.infer<typeof riskSchema>;

export const classificationSchema = z.object({
  category: emailCategorySchema,
  confidence: z.number().min(0).max(1),
  replyRequired: z.boolean(),
  sensitive: z.boolean(),
  financial: z.boolean(),
  legal: z.boolean(),
  security: z.boolean(),
  summary: z.string().min(1).max(1000),
  rationale: z.string().min(1).max(500),
});
export type Classification = z.infer<typeof classificationSchema>;

export const critiqueSchema = z.object({
  score: z.number().min(0).max(1),
  safe: z.boolean(),
  factual: z.boolean(),
  issues: z.array(z.string().max(300)).max(10),
  improvementInstructions: z.string().max(1200),
});
export type Critique = z.infer<typeof critiqueSchema>;

export const generatedReplySchema = z.object({
  subject: z.string().min(1).max(998),
  bodyText: z.string().min(1).max(50_000),
});
export type GeneratedReply = z.infer<typeof generatedReplySchema>;

export const loginSchema = z.object({email:z.email().max(320),password:z.string().min(12).max(128)});
export const registerSchema = loginSchema.extend({name:z.string().trim().min(1).max(100)});
export const draftUpdateSchema = z.object({subject:z.string().min(1).max(998),bodyText:z.string().min(1).max(50_000)});
export const policySettingsSchema = z.object({
  enabled:z.boolean(),
  autoSendEnabled:z.boolean(),
  minConfidence:z.number().min(0.5).max(1),
  allowedCategories:z.array(emailCategorySchema).max(20),
  blockedSenders:z.array(z.email()).max(500),
  maxDailySends:z.number().int().min(0).max(500),
});

export interface ApiSuccess<T> { ok:true; data:T }
export interface ApiFailure { ok:false; error:{code:string;message:string} }
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
export const success = <T>(data:T):ApiSuccess<T> => ({ok:true,data});
