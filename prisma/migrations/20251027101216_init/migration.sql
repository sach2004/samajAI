-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "originalTitle" TEXT,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "targetLanguage" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "segments" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingSession" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "targetLanguage" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "currencyConversions" INTEGER NOT NULL DEFAULT 0,
    "locationChanges" INTEGER NOT NULL DEFAULT 0,
    "measurementConversions" INTEGER NOT NULL DEFAULT 0,
    "culturalAdaptations" INTEGER NOT NULL DEFAULT 0,
    "processingTimeMs" INTEGER,
    "transcriptLength" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'started',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProcessingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "videoId" TEXT,
    "language" TEXT,
    "region" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Video_videoId_key" ON "Video"("videoId");

-- CreateIndex
CREATE INDEX "Video_videoId_idx" ON "Video"("videoId");

-- CreateIndex
CREATE INDEX "Video_createdAt_idx" ON "Video"("createdAt");

-- CreateIndex
CREATE INDEX "Transcript_videoId_type_idx" ON "Transcript"("videoId", "type");

-- CreateIndex
CREATE INDEX "ProcessingSession_videoId_idx" ON "ProcessingSession"("videoId");

-- CreateIndex
CREATE INDEX "ProcessingSession_createdAt_idx" ON "ProcessingSession"("createdAt");

-- CreateIndex
CREATE INDEX "Analytics_eventType_idx" ON "Analytics"("eventType");

-- CreateIndex
CREATE INDEX "Analytics_createdAt_idx" ON "Analytics"("createdAt");

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingSession" ADD CONSTRAINT "ProcessingSession_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
