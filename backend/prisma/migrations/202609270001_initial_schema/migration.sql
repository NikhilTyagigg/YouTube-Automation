CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "VideoStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');
CREATE TYPE "ChannelStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ACTION_REQUIRED');
CREATE TYPE "NotificationType" AS ENUM ('UPLOAD_SUCCESS', 'UPLOAD_FAILED', 'VIDEO_GENERATED', 'SCHEDULE_TRIGGERED', 'SYSTEM');

CREATE TABLE "users" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "revokedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "category" TEXT NOT NULL, "basePrompt" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'English', "style" TEXT NOT NULL DEFAULT 'Cinematic', "targetAudience" TEXT NOT NULL DEFAULT '',
    "duration" TEXT NOT NULL DEFAULT '60 sec', "isActive" BOOLEAN NOT NULL DEFAULT true, "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "prompt_history" (
    "id" TEXT NOT NULL, "promptTemplateId" TEXT NOT NULL, "originalPrompt" TEXT NOT NULL, "enhancedPrompt" TEXT NOT NULL,
    "finalPrompt" TEXT NOT NULL, "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prompt_history_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "generated_videos" (
    "id" TEXT NOT NULL, "promptId" TEXT NOT NULL, "videoName" TEXT NOT NULL, "videoPath" TEXT, "thumbnailPath" TEXT,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING', "duration" TEXT NOT NULL DEFAULT '0:00', "youtubeVideoId" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "generated_videos_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "video_metadata" (
    "id" TEXT NOT NULL, "videoId" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[], "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "video_metadata_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "youtube_channels" (
    "id" TEXT NOT NULL, "channelName" TEXT NOT NULL, "email" TEXT NOT NULL, "channelId" TEXT,
    "accessToken" TEXT NOT NULL, "refreshToken" TEXT NOT NULL, "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ChannelStatus" NOT NULL DEFAULT 'CONNECTED', "userId" TEXT NOT NULL,
    CONSTRAINT "youtube_channels_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "upload_jobs" (
    "id" TEXT NOT NULL, "videoId" TEXT NOT NULL, "channelId" TEXT NOT NULL, "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledTime" TIMESTAMP(3) NOT NULL, "uploadedAt" TIMESTAMP(3), "errorMessage" TEXT, "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "upload_jobs_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "video_analytics" (
    "id" TEXT NOT NULL, "videoId" TEXT NOT NULL, "views" BIGINT NOT NULL DEFAULT 0, "likes" BIGINT NOT NULL DEFAULT 0,
    "comments" BIGINT NOT NULL DEFAULT 0, "watchTime" DOUBLE PRECISION NOT NULL DEFAULT 0, "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0, "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "video_analytics_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL, "message" TEXT NOT NULL, "type" "NotificationType" NOT NULL, "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "settings" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "uploadTime" TEXT NOT NULL DEFAULT '09:00', "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'English', "defaultDuration" TEXT NOT NULL DEFAULT '60 sec',
    "defaultStyle" TEXT NOT NULL DEFAULT 'Cinematic', "geminiModel" TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    "youtubeChannelId" TEXT, "dailyUploadLimit" INTEGER NOT NULL DEFAULT 3, "notifications" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE INDEX "refresh_tokens_userId_expiresAt_idx" ON "refresh_tokens"("userId", "expiresAt");
CREATE INDEX "prompt_templates_userId_isActive_idx" ON "prompt_templates"("userId", "isActive");
CREATE INDEX "prompt_templates_category_idx" ON "prompt_templates"("category");
CREATE INDEX "prompt_history_promptTemplateId_generatedAt_idx" ON "prompt_history"("promptTemplateId", "generatedAt" DESC);
CREATE UNIQUE INDEX "generated_videos_youtubeVideoId_key" ON "generated_videos"("youtubeVideoId");
CREATE INDEX "generated_videos_status_generatedAt_idx" ON "generated_videos"("status", "generatedAt" DESC);
CREATE INDEX "generated_videos_promptId_generatedAt_idx" ON "generated_videos"("promptId", "generatedAt" DESC);
CREATE UNIQUE INDEX "video_metadata_videoId_key" ON "video_metadata"("videoId");
CREATE INDEX "youtube_channels_userId_status_idx" ON "youtube_channels"("userId", "status");
CREATE UNIQUE INDEX "youtube_channels_userId_channelId_key" ON "youtube_channels"("userId", "channelId");
CREATE INDEX "upload_jobs_status_scheduledTime_idx" ON "upload_jobs"("status", "scheduledTime");
CREATE INDEX "upload_jobs_channelId_status_idx" ON "upload_jobs"("channelId", "status");
CREATE INDEX "video_analytics_videoId_collectedAt_idx" ON "video_analytics"("videoId", "collectedAt" DESC);
CREATE INDEX "video_analytics_collectedAt_idx" ON "video_analytics"("collectedAt");
CREATE UNIQUE INDEX "video_analytics_videoId_collectedAt_key" ON "video_analytics"("videoId", "collectedAt");
CREATE INDEX "notifications_userId_read_createdAt_idx" ON "notifications"("userId", "read", "createdAt" DESC);
CREATE UNIQUE INDEX "settings_userId_key" ON "settings"("userId");

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prompt_history" ADD CONSTRAINT "prompt_history_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "prompt_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generated_videos" ADD CONSTRAINT "generated_videos_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompt_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "video_metadata" ADD CONSTRAINT "video_metadata_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "generated_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "youtube_channels" ADD CONSTRAINT "youtube_channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "upload_jobs" ADD CONSTRAINT "upload_jobs_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "generated_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "upload_jobs" ADD CONSTRAINT "upload_jobs_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "youtube_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "video_analytics" ADD CONSTRAINT "video_analytics_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "generated_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settings" ADD CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settings" ADD CONSTRAINT "settings_youtubeChannelId_fkey" FOREIGN KEY ("youtubeChannelId") REFERENCES "youtube_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;