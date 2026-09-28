-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "emailAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailedAt" TIMESTAMP(3),
ADD COLUMN     "sendEmail" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Notification_sendEmail_emailedAt_idx" ON "Notification"("sendEmail", "emailedAt");
