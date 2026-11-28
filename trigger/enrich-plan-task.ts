import { logger, task } from "@trigger.dev/sdk/v3";
import { enrichPlanTaskDirect } from "@/lib/tasks/enrich-plan-task";

export interface EnrichPlanTaskPayload {
  planTaskId: string;
  planId?: string;
  taskKey?: string;
}

export const enrichPlanTask = task({
  id: "enrich-plan-task",
  run: async (payload: EnrichPlanTaskPayload) => {
    const result = await enrichPlanTaskDirect(payload.planTaskId);

    if (result.skipped) {
      logger.info("Task enrichment skipped (already GENERATING or READY)", {
        planTaskId: payload.planTaskId,
      });
      return { skipped: true as const, planTaskId: payload.planTaskId };
    }

    logger.info("Task enriched successfully", {
      planTaskId: result.planTaskId,
      taskKey: result.taskKey,
      jevAlignmentScore: result.jevAlignmentScore,
    });

    return {
      skipped: false as const,
      planTaskId: result.planTaskId,
      taskKey: result.taskKey,
      jevAlignmentScore: result.jevAlignmentScore,
    };
  },
});
