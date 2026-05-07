-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('EMAIL', 'SMS', 'IN_APP', 'WEBSOCKET');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('SMTP', 'SENDGRID', 'ALIYUN_SMS', 'TENCENT_SMS', 'INTERNAL');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENDING', 'SUCCESS', 'FAILED', 'RETRY');

-- CreateEnum
CREATE TYPE "RetryStrategy" AS ENUM ('FIXED', 'EXPONENTIAL');

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelProvider" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChannelProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateChannel" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "channelId" TEXT,
    "providerId" TEXT,
    "recipient" TEXT NOT NULL,
    "recipientId" TEXT,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetryCount" INTEGER NOT NULL DEFAULT 3,
    "retryStrategy" "RetryStrategy" NOT NULL DEFAULT 'EXPONENTIAL',
    "retryInterval" INTEGER NOT NULL DEFAULT 5000,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InAppMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietStart" TEXT,
    "quietEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Channel_type_idx" ON "Channel"("type");

-- CreateIndex
CREATE INDEX "Channel_isEnabled_idx" ON "Channel"("isEnabled");

-- CreateIndex
CREATE INDEX "ChannelProvider_channelId_idx" ON "ChannelProvider"("channelId");

-- CreateIndex
CREATE INDEX "ChannelProvider_isEnabled_idx" ON "ChannelProvider"("isEnabled");

-- CreateIndex
CREATE INDEX "ChannelProvider_priority_idx" ON "ChannelProvider"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "Template_code_key" ON "Template"("code");

-- CreateIndex
CREATE INDEX "Template_code_idx" ON "Template"("code");

-- CreateIndex
CREATE INDEX "Template_isEnabled_idx" ON "Template"("isEnabled");

-- CreateIndex
CREATE INDEX "TemplateVersion_templateId_idx" ON "TemplateVersion"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVersion_templateId_version_key" ON "TemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "TemplateChannel_templateId_idx" ON "TemplateChannel"("templateId");

-- CreateIndex
CREATE INDEX "TemplateChannel_channelId_idx" ON "TemplateChannel"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateChannel_templateId_channelId_key" ON "TemplateChannel"("templateId", "channelId");

-- CreateIndex
CREATE INDEX "Message_recipient_idx" ON "Message"("recipient");

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "Message"("recipientId");

-- CreateIndex
CREATE INDEX "Message_status_idx" ON "Message"("status");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_sentAt_idx" ON "Message"("sentAt");

-- CreateIndex
CREATE INDEX "Message_templateId_idx" ON "Message"("templateId");

-- CreateIndex
CREATE INDEX "Message_channelId_idx" ON "Message"("channelId");

-- CreateIndex
CREATE INDEX "Message_priority_idx" ON "Message"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "InAppMessage_messageId_key" ON "InAppMessage"("messageId");

-- CreateIndex
CREATE INDEX "InAppMessage_userId_idx" ON "InAppMessage"("userId");

-- CreateIndex
CREATE INDEX "InAppMessage_isRead_idx" ON "InAppMessage"("isRead");

-- CreateIndex
CREATE INDEX "InAppMessage_createdAt_idx" ON "InAppMessage"("createdAt");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_channelId_idx" ON "UserPreference"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_channelId_notificationType_key" ON "UserPreference"("userId", "channelId", "notificationType");

-- AddForeignKey
ALTER TABLE "ChannelProvider" ADD CONSTRAINT "ChannelProvider_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateVersion" ADD CONSTRAINT "TemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateChannel" ADD CONSTRAINT "TemplateChannel_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateChannel" ADD CONSTRAINT "TemplateChannel_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ChannelProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppMessage" ADD CONSTRAINT "InAppMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
