ALTER TABLE "EmailAccount"
ADD COLUMN "watchExpiresAt" TIMESTAMP(3);

CREATE INDEX "EmailAccount_status_watchExpiresAt_idx"
ON "EmailAccount"("status", "watchExpiresAt");