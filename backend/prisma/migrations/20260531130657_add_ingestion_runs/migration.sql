-- CreateTable
CREATE TABLE "ingestion_runs" (
    "id" SERIAL NOT NULL,
    "runId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER NOT NULL,
    "totalFetched" INTEGER NOT NULL DEFAULT 0,
    "totalInserted" INTEGER NOT NULL DEFAULT 0,
    "totalSkipped" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "alertsGenerated" INTEGER NOT NULL DEFAULT 0,
    "emailsEnqueued" INTEGER NOT NULL DEFAULT 0,
    "companiesJson" JSONB NOT NULL DEFAULT '[]',
    "errorsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingestion_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ingestion_runs_runId_key" ON "ingestion_runs"("runId");

-- CreateIndex
CREATE INDEX "ingestion_runs_source_idx" ON "ingestion_runs"("source");

-- CreateIndex
CREATE INDEX "ingestion_runs_startedAt_idx" ON "ingestion_runs"("startedAt");
