import type { AppConfig } from '@mailpilot/config';
import type { PrismaClient } from '../generated/prisma/client.js';
import { authenticatedGmail } from './gmail.js';

const renewalWindowMs = 24 * 60 * 60 * 1000;

export async function configureGmailWatch(
  prisma: PrismaClient,
  config: AppConfig,
  accountId: string,
  userId: string,
): Promise<{ historyId: string; expiresAt: Date }> {
  if (!config.GMAIL_PUBSUB_TOPIC) {
    throw new Error('Gmail Pub/Sub topic is not configured');
  }

  const account = await prisma.emailAccount.findFirstOrThrow({
    where: { id: accountId, userId, status: 'ACTIVE' },
    include: { credential: true },
  });
  if (!account.credential) throw new Error('OAuth credential missing');

  const result = await authenticatedGmail(
    config,
    account.credential,
  ).users.watch({
    userId: 'me',
    requestBody: {
      topicName: config.GMAIL_PUBSUB_TOPIC,
      labelIds: ['INBOX'],
      labelFilterBehavior: 'include',
    },
  });

  if (!result.data.historyId || !result.data.expiration) {
    throw new Error('Gmail watch response was incomplete');
  }

  const expiresAt = new Date(Number(result.data.expiration));
  if (Number.isNaN(expiresAt.getTime())) {
    throw new Error('Gmail watch expiration was invalid');
  }

  await prisma.emailAccount.update({
    where: { id: account.id },
    data: { historyId: result.data.historyId, watchExpiresAt: expiresAt },
  });

  return { historyId: result.data.historyId, expiresAt };
}

export async function renewExpiringGmailWatches(
  prisma: PrismaClient,
  config: AppConfig,
): Promise<number> {
  if (!config.GMAIL_PUBSUB_TOPIC) return 0;

  const accounts = await prisma.emailAccount.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { watchExpiresAt: null },
        { watchExpiresAt: { lte: new Date(Date.now() + renewalWindowMs) } },
      ],
    },
    select: { id: true, userId: true },
  });

  const failures: string[] = [];
  for (const account of accounts) {
    try {
      await configureGmailWatch(prisma, config, account.id, account.userId);
    } catch {
      failures.push(account.id);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Failed to renew ${failures.length} Gmail watch subscription(s)`);
  }
  return accounts.length;
}