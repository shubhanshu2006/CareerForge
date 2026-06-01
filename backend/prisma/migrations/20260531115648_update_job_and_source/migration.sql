/*
  Warnings:

  - A unique constraint covering the columns `[source,sourceJobId]` on the table `jobs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Source" ADD VALUE 'WORKDAY';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sourceJobId" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "jobs_company_title_idx" ON "jobs"("company", "title");

-- CreateIndex
CREATE INDEX "jobs_source_idx" ON "jobs"("source");

-- CreateIndex
CREATE INDEX "jobs_sourceJobId_idx" ON "jobs"("sourceJobId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_source_sourceJobId_key" ON "jobs"("source", "sourceJobId");
