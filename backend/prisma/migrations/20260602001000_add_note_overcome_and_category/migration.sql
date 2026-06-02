-- AlterTable
ALTER TABLE "application_notes" ADD COLUMN "category" TEXT;
ALTER TABLE "application_notes" ADD COLUMN "overcome" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "application_notes" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "application_notes_applicationId_idx" ON "application_notes"("applicationId");
CREATE INDEX "application_notes_category_idx" ON "application_notes"("category");
CREATE INDEX "application_notes_overcome_idx" ON "application_notes"("overcome");
