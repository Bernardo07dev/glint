-- CreateEnum
CREATE TYPE "TaskEnrichmentStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "PlanTask" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "taskKey" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "requiredTools" TEXT[],
    "searchQueryUsed" TEXT NOT NULL,
    "scheduledDate" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "consumeMinutes" INTEGER NOT NULL,
    "practiceMinutes" INTEGER NOT NULL,
    "unlockAt" TIMESTAMP(3) NOT NULL,
    "enrichmentStatus" "TaskEnrichmentStatus" NOT NULL DEFAULT 'PENDING',
    "jevAlignmentScore" DOUBLE PRECISION,
    "enrichedAt" TIMESTAMP(3),
    "content" JSONB,
    "status" "TaskStatus" NOT NULL DEFAULT 'LOCKED',
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "completedAt" TIMESTAMP(3),
    "difficultyRating" TEXT,
    "userNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanTask_planId_scheduledDate_idx" ON "PlanTask"("planId", "scheduledDate");

-- CreateIndex
CREATE INDEX "PlanTask_planId_status_idx" ON "PlanTask"("planId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PlanTask_planId_order_key" ON "PlanTask"("planId", "order");

-- AddForeignKey
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "LearningPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
