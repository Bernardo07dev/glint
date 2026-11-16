-- CreateEnum
CREATE TYPE "PlanStage" AS ENUM ('REFINING_GOAL', 'INTERVIEWING_STEPS', 'GENERATING_TASKS', 'ENRICHING_TASKS', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "LearningPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isFirstPlan" BOOLEAN NOT NULL DEFAULT false,
    "stage" "PlanStage" NOT NULL DEFAULT 'REFINING_GOAL',
    "rawInput" TEXT NOT NULL,
    "refinedGoal" TEXT,
    "executableMeta" JSONB,
    "planStructure" JSONB,
    "currentStepId" TEXT,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanMessage" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "stage" "PlanStage" NOT NULL,
    "stepId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningPlan_userId_stage_idx" ON "LearningPlan"("userId", "stage");

-- CreateIndex
CREATE INDEX "PlanMessage_planId_stage_stepId_createdAt_idx" ON "PlanMessage"("planId", "stage", "stepId", "createdAt");

-- AddForeignKey
ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanMessage" ADD CONSTRAINT "PlanMessage_planId_fkey" FOREIGN KEY ("planId") REFERENCES "LearningPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
