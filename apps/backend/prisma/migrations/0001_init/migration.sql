-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'REAUTH_REQUIRED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'NO_REPLY');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('GENERATED', 'AWAITING_REVIEW', 'APPROVED', 'REJECTED', 'SENDING', 'SENT', 'FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PolicyOutcome" AS ENUM ('AUTO_SEND', 'HUMAN_REVIEW', 'BLOCK');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVE', 'REJECT', 'EDIT_AND_APPROVE');

-- CreateEnum
CREATE TYPE "SendStatus" AS ENUM ('RESERVED', 'SENT', 'FAILED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'gmail',
    "providerAccountId" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "historyId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthCredential" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT[],
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailThread" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "providerThreadId" TEXT NOT NULL,
    "subject" VARCHAR(998) NOT NULL,
    "snippet" VARCHAR(1000) NOT NULL DEFAULT '',
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "internetMessageId" VARCHAR(998),
    "direction" "MessageDirection" NOT NULL,
    "fromAddress" VARCHAR(320) NOT NULL,
    "toAddresses" TEXT[],
    "ccAddresses" TEXT[],
    "subject" VARCHAR(998) NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "snippet" VARCHAR(1000) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "rawHeaders" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIClassification" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "replyRequired" BOOLEAN NOT NULL,
    "sensitive" BOOLEAN NOT NULL,
    "financial" BOOLEAN NOT NULL,
    "legal" BOOLEAN NOT NULL,
    "security" BOOLEAN NOT NULL,
    "injectionScore" DOUBLE PRECISION NOT NULL,
    "injectionSignals" TEXT[],
    "summary" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplyDraft" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "status" "DraftStatus" NOT NULL DEFAULT 'GENERATED',
    "subject" VARCHAR(998) NOT NULL,
    "bodyText" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "policyOutcome" "PolicyOutcome" NOT NULL,
    "policyReasons" TEXT[],
    "idempotencyKey" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReplyDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICritique" (
    "id" UUID NOT NULL,
    "draftId" UUID NOT NULL,
    "iteration" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "safe" BOOLEAN NOT NULL,
    "factual" BOOLEAN NOT NULL,
    "issues" TEXT[],
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICritique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationPolicy" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "autoSendEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "allowedCategories" TEXT[],
    "blockedSenders" TEXT[],
    "maxDailySends" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeItem" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "draftId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "previousBodyHash" TEXT NOT NULL,
    "edited" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SendAttempt" (
    "id" UUID NOT NULL,
    "draftId" UUID NOT NULL,
    "sendKey" TEXT NOT NULL,
    "status" "SendStatus" NOT NULL,
    "providerMessageId" TEXT,
    "internetMessageId" TEXT NOT NULL,
    "errorCode" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SendAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "outcome" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "EmailAccount_userId_status_idx" ON "EmailAccount"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAccount_provider_providerAccountId_key" ON "EmailAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAccount_userId_email_key" ON "EmailAccount"("userId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthCredential_accountId_key" ON "OAuthCredential"("accountId");

-- CreateIndex
CREATE INDEX "EmailThread_userId_lastMessageAt_idx" ON "EmailThread"("userId", "lastMessageAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "EmailThread_accountId_providerThreadId_key" ON "EmailThread"("accountId", "providerThreadId");

-- CreateIndex
CREATE INDEX "EmailMessage_threadId_sentAt_idx" ON "EmailMessage"("threadId", "sentAt");

-- CreateIndex
CREATE INDEX "EmailMessage_internetMessageId_idx" ON "EmailMessage"("internetMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMessage_accountId_providerMessageId_key" ON "EmailMessage"("accountId", "providerMessageId");

-- CreateIndex
CREATE INDEX "AIClassification_threadId_createdAt_idx" ON "AIClassification"("threadId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ReplyDraft_idempotencyKey_key" ON "ReplyDraft"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ReplyDraft_threadId_status_idx" ON "ReplyDraft"("threadId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AICritique_draftId_iteration_key" ON "AICritique"("draftId", "iteration");

-- CreateIndex
CREATE INDEX "AutomationPolicy_userId_enabled_priority_idx" ON "AutomationPolicy"("userId", "enabled", "priority");

-- CreateIndex
CREATE INDEX "KnowledgeItem_userId_enabled_idx" ON "KnowledgeItem"("userId", "enabled");

-- CreateIndex
CREATE INDEX "Review_reviewerId_createdAt_idx" ON "Review"("reviewerId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SendAttempt_sendKey_key" ON "SendAttempt"("sendKey");

-- CreateIndex
CREATE UNIQUE INDEX "SendAttempt_internetMessageId_key" ON "SendAttempt"("internetMessageId");

-- CreateIndex
CREATE INDEX "SendAttempt_status_reservedAt_idx" ON "SendAttempt"("status", "reservedAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthCredential" ADD CONSTRAINT "OAuthCredential_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIClassification" ADD CONSTRAINT "AIClassification_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyDraft" ADD CONSTRAINT "ReplyDraft_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICritique" ADD CONSTRAINT "AICritique_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ReplyDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationPolicy" ADD CONSTRAINT "AutomationPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeItem" ADD CONSTRAINT "KnowledgeItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ReplyDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SendAttempt" ADD CONSTRAINT "SendAttempt_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ReplyDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

