import { runs, tasks } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/infra/prisma";
import type { RescheduleJobDelta } from "@/lib/schedule/task-reschedule";
import type { enrichPlanTask } from "@/trigger/enrich-plan-task";

export interface ScheduledTaskTriggerResult {
  planTaskId: string;
  taskKey: string;
  triggerRunId: string | null;
}

function buildTaskTags(
  planId: string | undefined,
  taskKey: string,
): string[] {
  const tags = [`task:${taskKey}`];
  if (planId) {
    tags.unshift(`plan:${planId}`);
  }
  return tags;
}

function buildTaskMetadata(
  planTaskId: string,
  planId: string | undefined,
  taskKey: string,
): Record<string, string> {
  return {
    planTaskId,
    taskKey,
    ...(planId ? { planId } : {}),
  };
}

/**
 * Cancels Trigger.dev runs in best-effort mode (ignoring null/duplicates).
 */
export async function cancelTriggerRuns(
  runIds: Array<string | null | undefined>,
): Promise<void> {
  const uniqueIds = Array.from(
    new Set(runIds.filter((id): id is string => Boolean(id))),
  );
  if (uniqueIds.length === 0) return;

  const settled = await Promise.allSettled(
    uniqueIds.map((runId) => runs.cancel(runId)),
  );

  settled.forEach((entry, idx) => {
    if (entry.status === "rejected") {
      console.error(
        `[trigger-jobs] Falha ao cancelar run ${uniqueIds[idx]}:`,
        entry.reason,
      );
    }
  });
}

/**
 * Schedules `enrich-plan-task` runs for every newly created `PlanTask` on `accept_plan`.
 * Tasks whose `triggerAt` is already due fire immediately without delay.
 */
export async function schedulePlanTasksOnAccept(
  createdTasks: Array<{
    id: string;
    planId?: string;
    taskKey: string;
    triggerAt: Date;
  }>,
): Promise<ScheduledTaskTriggerResult[]> {
  if (createdTasks.length === 0) return [];

  const nowMs = Date.now();

  const settled = await Promise.allSettled(
    createdTasks.map(async (taskItem) => {
      const isDueNow = taskItem.triggerAt.getTime() <= nowMs;
      const tags = buildTaskTags(taskItem.planId, taskItem.taskKey);
      const metadata = buildTaskMetadata(
        taskItem.id,
        taskItem.planId,
        taskItem.taskKey,
      );
      const payload = {
        planTaskId: taskItem.id,
        ...(taskItem.planId ? { planId: taskItem.planId } : {}),
        taskKey: taskItem.taskKey,
      };
      const handle = isDueNow
        ? await tasks.trigger<typeof enrichPlanTask>(
            "enrich-plan-task",
            payload,
            { tags, metadata },
          )
        : await tasks.trigger<typeof enrichPlanTask>(
            "enrich-plan-task",
            payload,
            { delay: taskItem.triggerAt, tags, metadata },
          );

      await prisma.planTask.update({
        where: { id: taskItem.id },
        data: { triggerRunId: handle.id },
      });

      return {
        planTaskId: taskItem.id,
        taskKey: taskItem.taskKey,
        triggerRunId: handle.id,
      };
    }),
  );

  return settled.map((entry, idx) => {
    const taskItem = createdTasks[idx];
    if (entry.status === "fulfilled") {
      return entry.value;
    }
    console.error(
      `[trigger-jobs] Falha ao agendar task ${taskItem.taskKey} (${taskItem.id}):`,
      entry.reason,
    );
    return {
      planTaskId: taskItem.id,
      taskKey: taskItem.taskKey,
      triggerRunId: null,
    };
  });
}

/**
 * Updates Trigger.dev scheduled runs for moved `PENDING`/`FAILED` tasks after a reschedule.
 */
export async function reschedulePlanTaskRuns(
  jobsToReschedule: RescheduleJobDelta[],
): Promise<ScheduledTaskTriggerResult[]> {
  if (jobsToReschedule.length === 0) return [];

  const nowMs = Date.now();

  const settled = await Promise.allSettled(
    jobsToReschedule.map(async (delta) => {
      const isDueNow = delta.nextTriggerAt.getTime() <= nowMs;
      let nextRunId: string | null = null;

      if (delta.previousTriggerRunId && !isDueNow) {
        try {
          const rescheduled = await runs.reschedule(delta.previousTriggerRunId, {
            delay: delta.nextTriggerAt,
          });
          nextRunId = rescheduled.id;
        } catch {
          nextRunId = null;
        }
      }

      if (!nextRunId) {
        if (delta.previousTriggerRunId) {
          await runs.cancel(delta.previousTriggerRunId).catch(() => null);
        }

        const tags = buildTaskTags(delta.planId, delta.taskKey);
        const metadata = buildTaskMetadata(
          delta.taskId,
          delta.planId,
          delta.taskKey,
        );
        const payload = {
          planTaskId: delta.taskId,
          ...(delta.planId ? { planId: delta.planId } : {}),
          taskKey: delta.taskKey,
        };
        const handle = isDueNow
          ? await tasks.trigger<typeof enrichPlanTask>(
              "enrich-plan-task",
              payload,
              { tags, metadata },
            )
          : await tasks.trigger<typeof enrichPlanTask>(
              "enrich-plan-task",
              payload,
              { delay: delta.nextTriggerAt, tags, metadata },
            );
        nextRunId = handle.id;
      }

      await prisma.planTask.update({
        where: { id: delta.taskId },
        data: { triggerRunId: nextRunId },
      });

      return {
        planTaskId: delta.taskId,
        taskKey: delta.taskKey,
        triggerRunId: nextRunId,
      };
    }),
  );

  return settled.map((entry, idx) => {
    const delta = jobsToReschedule[idx];
    if (entry.status === "fulfilled") {
      return entry.value;
    }
    console.error(
      `[trigger-jobs] Falha ao reagendar run da task ${delta.taskKey} (${delta.taskId}):`,
      entry.reason,
    );
    return {
      planTaskId: delta.taskId,
      taskKey: delta.taskKey,
      triggerRunId: null,
    };
  });
}

/**
 * Immediately triggers `enrich-plan-task` without delay (On-Demand PRO advance or retry).
 */
export async function triggerTaskOnDemand(planTaskId: string): Promise<{
  triggered: boolean;
  triggerRunId: string | null;
  reason?: string;
}> {
  const planTask = await prisma.planTask.findUnique({
    where: { id: planTaskId },
    select: {
      id: true,
      planId: true,
      taskKey: true,
      enrichmentStatus: true,
      triggerRunId: true,
    },
  });

  if (!planTask) {
    throw new Error(`PlanTask ${planTaskId} não encontrada.`);
  }

  if (
    planTask.enrichmentStatus !== "PENDING" &&
    planTask.enrichmentStatus !== "FAILED"
  ) {
    return {
      triggered: false,
      triggerRunId: planTask.triggerRunId,
      reason: planTask.enrichmentStatus,
    };
  }

  if (planTask.triggerRunId) {
    await runs.cancel(planTask.triggerRunId).catch(() => null);
  }

  const handle = await tasks.trigger<typeof enrichPlanTask>(
    "enrich-plan-task",
    {
      planTaskId: planTask.id,
      planId: planTask.planId,
      taskKey: planTask.taskKey,
    },
    {
      tags: buildTaskTags(planTask.planId, planTask.taskKey),
      metadata: buildTaskMetadata(
        planTask.id,
        planTask.planId,
        planTask.taskKey,
      ),
    },
  );

  await prisma.planTask.update({
    where: { id: planTask.id },
    data: { triggerRunId: handle.id },
  });

  return {
    triggered: true,
    triggerRunId: handle.id,
  };
}
