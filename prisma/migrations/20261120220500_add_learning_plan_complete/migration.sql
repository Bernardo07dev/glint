-- AlterEnum
BEGIN;
CREATE TYPE "PlanStage_new" AS ENUM ('REFINING_GOAL', 'INTERVIEWING_STEPS', 'GENERATING_TASKS', 'ENRICHING_TASKS', 'ACTIVE', 'COMPLETED');
ALTER TABLE "public"."LearningPlan" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "LearningPlan" ALTER COLUMN "stage" TYPE "PlanStage_new" USING ("stage"::text::"PlanStage_new");
ALTER TABLE "PlanMessage" ALTER COLUMN "stage" TYPE "PlanStage_new" USING ("stage"::text::"PlanStage_new");
ALTER TYPE "PlanStage" RENAME TO "PlanStage_old";
ALTER TYPE "PlanStage_new" RENAME TO "PlanStage";
DROP TYPE "public"."PlanStage_old";
ALTER TABLE "LearningPlan" ALTER COLUMN "stage" SET DEFAULT 'REFINING_GOAL';
COMMIT;

-- AlterTable
ALTER TABLE "LearningPlan" ADD COLUMN     "complete" BOOLEAN NOT NULL DEFAULT false;
