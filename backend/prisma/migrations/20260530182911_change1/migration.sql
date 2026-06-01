-- CreateTable
CREATE TABLE "interview_failure_analyses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "analysis" JSONB NOT NULL,
    "noteCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_failure_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_gap_reports" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "targetRole" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_gap_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preparation_roadmaps" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "targetRole" TEXT NOT NULL,
    "roadmap" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preparation_roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pattern_insights" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "insight" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pattern_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_failure_analyses_userId_createdAt_idx" ON "interview_failure_analyses"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "skill_gap_reports_userId_createdAt_idx" ON "skill_gap_reports"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "preparation_roadmaps_userId_createdAt_idx" ON "preparation_roadmaps"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "pattern_insights_userId_createdAt_idx" ON "pattern_insights"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "interview_failure_analyses" ADD CONSTRAINT "interview_failure_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_gap_reports" ADD CONSTRAINT "skill_gap_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_roadmaps" ADD CONSTRAINT "preparation_roadmaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pattern_insights" ADD CONSTRAINT "pattern_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
