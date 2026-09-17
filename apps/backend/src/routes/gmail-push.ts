import type { FastifyPluginAsync } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { success } from '@mailpilot/shared';
import { audit } from '../audit.js';
import {
  decodeGmailNotification,
  pushEnvelopeSchema,
} from '../email/pubsub.js';

const verifier = new OAuth2Client();
const idSchema = z.object({ id: z.uuid() });

export const gmailPushRoutes: FastifyPluginAsync = async app => {
  app.post('/push', async (request, reply) => {
    const { GMAIL_PUBSUB_AUDIENCE, GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL } =
      app.services.config;
    if (!GMAIL_PUBSUB_AUDIENCE || !GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL) {
      return reply.code(503).send({
        ok: false,
        error: {
          code: 'PUSH_NOT_CONFIGURED',
          message: 'Gmail push authentication is not configured',
        },
      });
    }

    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;
    if (!token) {
      return reply.code(401).send({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Push identity is required' },
      });
    }

    try {
      const ticket = await verifier.verifyIdToken({
        idToken: token,
        audience: GMAIL_PUBSUB_AUDIENCE,
      });
      const identity = ticket.getPayload();
      if (
        identity?.email !== GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL ||
        identity.email_verified !== true
      ) {
        return reply.code(403).send({
          ok: false,
          error: { code: 'FORBIDDEN', message: 'Push identity is not allowed' },
        });
      }
    } catch {
      return reply.code(401).send({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Push identity is invalid' },
      });
    }

    const envelope = pushEnvelopeSchema.parse(request.body);
    const notification = decodeGmailNotification(envelope.message.data);
    const account = await app.services.prisma.emailAccount.findFirst({
      where: {
        email: notification.emailAddress.toLowerCase(),
        status: 'ACTIVE',
      },
      select: { id: true, userId: true },
    });

    if (!account) return reply.code(204).send();

    await app.services.syncQueue.add(
      'sync-account',
      { accountId: account.id, userId: account.userId },
      {
        jobId: `gmail-push-${account.id}-${notification.historyId}`,
        attempts: 5,
        backoff: { type: 'exponential', delay: 5_000 },
      },
    );
    await audit(app.services.prisma, {
      userId: account.userId,
      action: 'GMAIL_PUSH_RECEIVED',
      resourceType: 'EMAIL_ACCOUNT',
      resourceId: account.id,
      outcome: 'SUCCESS',
      metadata: {
        historyId: notification.historyId,
        pubsubMessageId: envelope.message.messageId,
      },
    });
    return reply.code(204).send();
  });

  app.post(
    '/accounts/:id/watch',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const auth = request.authUser;
      if (!auth) return;
      if (!app.services.config.GMAIL_PUBSUB_TOPIC) {
        return reply.code(409).send({
          ok: false,
          error: {
            code: 'PUSH_NOT_CONFIGURED',
            message: 'Gmail Pub/Sub topic is not configured',
          },
        });
      }

      const { id } = idSchema.parse(request.params);
      const account = await app.services.prisma.emailAccount.findFirst({
        where: { id, userId: auth.sub, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!account) {
        return reply.code(404).send({
          ok: false,
          error: { code: 'NOT_FOUND', message: 'Gmail account not found' },
        });
      }

      await app.services.syncQueue.add(
        'watch-account',
        { accountId: account.id, userId: auth.sub },
        {
          jobId: `watch-${account.id}-${Date.now()}`,
          attempts: 5,
          backoff: { type: 'exponential', delay: 10_000 },
        },
      );
      await audit(app.services.prisma, {
        userId: auth.sub,
        action: 'GMAIL_WATCH_REQUESTED',
        resourceType: 'EMAIL_ACCOUNT',
        resourceId: account.id,
        outcome: 'SUCCESS',
      });
      return reply.code(202).send(success({ scheduled: true }));
    },
  );
};