-- CreateEnum
CREATE TYPE "StepProgressStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "PlanTask" ADD COLUMN     "currentStepId" TEXT;

-- CreateTable
CREATE TABLE "PlanTaskStepProgress" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "toolType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "status" "StepProgressStatus" NOT NULL DEFAULT 'PENDING',
    "totalChecklistItems" INTEGER NOT NULL DEFAULT 0,
    "checkedItems" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastInteractionAt" TIMESTAMP(3),
    "quizData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanTaskStepProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanTaskStepProgress_taskId_order_idx" ON "PlanTaskStepProgress"("taskId", "order");

-- CreateIndex
CREATE INDEX "PlanTaskStepProgress_taskId_status_idx" ON "PlanTaskStepProgress"("taskId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PlanTaskStepProgress_taskId_stepId_key" ON "PlanTaskStepProgress"("taskId", "stepId");

-- AddForeignKey
ALTER TABLE "PlanTaskStepProgress" ADD CONSTRAINT "PlanTaskStepProgress_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PlanTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
