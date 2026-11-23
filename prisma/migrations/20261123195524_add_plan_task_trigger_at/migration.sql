/*
  Warnings:

  - Added the required column `triggerAt` to the `PlanTask` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlanTask" ADD COLUMN     "triggerAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "triggerRunId" TEXT;

-- CreateIndex
CREATE INDEX "PlanTask_triggerAt_idx" ON "PlanTask"("triggerAt");
