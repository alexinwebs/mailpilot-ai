import { z } from 'zod';

export const pushEnvelopeSchema = z.object({
  message: z.object({
    data: z.string().min(1).max(20_000),
    messageId: z.string().min(1).max(500),
  }),
  subscription: z.string().min(1).max(1000),
});

const notificationSchema = z.object({
  emailAddress: z.email(),
  historyId: z.string().regex(/^\d+$/),
});

export function decodeGmailNotification(data: string): {
  emailAddress: string;
  historyId: string;
} {
  const decoded: unknown = JSON.parse(
    Buffer.from(data, 'base64').toString('utf8'),
  );
  return notificationSchema.parse(decoded);
}