-- CreateEnum
CREATE TYPE "ReplanStrategy" AS ENUM ('SCHEDULE_ONLY', 'PARTIAL_REPLAN', 'GOAL_PIVOT');

-- CreateTable
CREATE TABLE "PlanReplan" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "strategy" "ReplanStrategy" NOT NULL,
    "reasonSummary" TEXT NOT NULL,
    "oldPlan" JSONB NOT NULL,
    "newPlan" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanReplan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanReplan_planId_createdAt_idx" ON "PlanReplan"("planId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanReplan_planId_version_key" ON "PlanReplan"("planId", "version");

-- AddForeignKey
ALTER TABLE "PlanReplan" ADD CONSTRAINT "PlanReplan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "LearningPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
