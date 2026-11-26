import type {
  PlanTask as PrismaPlanTask,
  Prisma,
  TaskStatus as PrismaTaskStatus,
} from "@prisma/client";
import {
  computeNextRescheduleSlot,
  getTodayIsoInTimezone,
  rescheduleRemainingTasks,
  type PlanStructure,
  type RoutineContract,
} from "@/lib/plan/plan-structure";
import { prisma } from "@/lib/infra/prisma";
import {
  computeTriggerAt,
  computeUnlockAt,
  normalizeTimeZone,
} from "@/lib/schedule/task-schedule";
import { reschedulePlanTaskRuns } from "@/lib/infra/trigger-jobs";

export interface RescheduleJobDelta {
  taskId: string;
  taskKey: string;
  previousTriggerRunId: string | null;
  nextTriggerAt: Date;
}

export interface RescheduleTaskUpdate {
  id: string;
  taskKey: string;
  scheduledDate: string;
  dayOfWeek: string;
  startTime: string;
  unlockAt: Date;
  triggerAt: Date;
  status: PrismaTaskStatus;
  clearTriggerRunId: boolean;
}

export interface ReschedulePlanTasksResult {
  updatedCount: number;
  updatedStructure: PlanStructure | null;
  jobsToReschedule: RescheduleJobDelta[];
}

export function computePlanTaskReschedule(input: {
  tasks: Array<
    Pick<
      PrismaPlanTask,
      | "id"
      | "taskKey"
      | "order"
      | "scheduledDate"
      | "status"
      | "enrichmentStatus"
      | "triggerRunId"
    >
  >;
  targetTaskIdentifier: string;
  routineContract?: RoutineContract;
  timeZone?: string | null;
  todayIso: string;
}): {
  updates: RescheduleTaskUpdate[];
  jobsToReschedule: RescheduleJobDelta[];
} {
  const sorted = [...input.tasks].sort((a, b) => a.order - b.order);
  const targetIndex = sorted.findIndex(
    (t) =>
      t.id === input.targetTaskIdentifier ||
      t.taskKey === input.targetTaskIdentifier,
  );

  if (targetIndex === -1) {
    return { updates: [], jobsToReschedule: [] };
  }

  const timeZone = normalizeTimeZone(input.timeZone);
  const target = sorted[targetIndex];
  let cursorDate =
    target.scheduledDate > input.todayIso
      ? target.scheduledDate
      : input.todayIso;

  const updates: RescheduleTaskUpdate[] = [];
  const jobsToReschedule: RescheduleJobDelta[] = [];

  for (let i = targetIndex; i < sorted.length; i++) {
    const task = sorted[i];
    if (task.status === "COMPLETED" || task.status === "SKIPPED") {
      continue;
    }

    const nextSlot = computeNextRescheduleSlot(
      input.routineContract,
      cursorDate,
    );
    if (!nextSlot) {
      break;
    }

    const unlockAt = computeUnlockAt(nextSlot.date, timeZone);
    const triggerAt = computeTriggerAt(
      nextSlot.date,
      nextSlot.startTime,
      timeZone,
    );

    const status: PrismaTaskStatus =
      task.status === "IN_PROGRESS" && nextSlot.date <= input.todayIso
        ? "IN_PROGRESS"
        : nextSlot.date > input.todayIso
          ? "LOCKED"
          : "AVAILABLE";

    const needsJobReschedule =
      task.enrichmentStatus === "PENDING" || task.enrichmentStatus === "FAILED";

    updates.push({
      id: task.id,
      taskKey: task.taskKey,
      scheduledDate: nextSlot.date,
      dayOfWeek: nextSlot.dayOfWeek,
      startTime: nextSlot.startTime,
      unlockAt,
      triggerAt,
      status,
      clearTriggerRunId: needsJobReschedule && task.triggerRunId !== null,
    });

    if (needsJobReschedule) {
      jobsToReschedule.push({
        taskId: task.id,
        taskKey: task.taskKey,
        previousTriggerRunId: task.triggerRunId,
        nextTriggerAt: triggerAt,
      });
    }

    cursorDate = nextSlot.date;
  }

  return { updates, jobsToReschedule };
}

export async function reschedulePlanTasks(input: {
  planId: string;
  targetTaskIdentifier: string;
  planStructure: PlanStructure | null;
  userTimezone?: string | null;
}): Promise<ReschedulePlanTasksResult> {
  const timeZone = normalizeTimeZone(
    input.planStructure?.routineContract?.timezone || input.userTimezone,
  );
  const todayIso = getTodayIsoInTimezone(timeZone);

  const dbTasks = await prisma.planTask.findMany({
    where: { planId: input.planId },
    orderBy: { order: "asc" },
  });

  if (dbTasks.length > 0) {
    const { updates, jobsToReschedule } = computePlanTaskReschedule({
      tasks: dbTasks,
      targetTaskIdentifier: input.targetTaskIdentifier,
      routineContract: input.planStructure?.routineContract,
      timeZone,
      todayIso,
    });

    const updatesByKey = new Map(updates.map((u) => [u.taskKey, u]));

    const updatedStructure: PlanStructure | null = input.planStructure
      ? {
          ...input.planStructure,
          tasks: input.planStructure.tasks.map((task) => {
            const update = updatesByKey.get(task.taskId);
            if (!update) return task;

            return {
              ...task,
              schedule: {
                ...task.schedule,
                date: update.scheduledDate,
                dayOfWeek: update.dayOfWeek,
                startTime: update.startTime,
              },
              lockState: {
                isLocked: update.scheduledDate > todayIso,
                unlockAt: update.unlockAt.toISOString(),
              },
            };
          }),
        }
      : null;

    if (updates.length > 0) {
      await prisma.$transaction([
        ...updates.map((update) =>
          prisma.planTask.update({
            where: { id: update.id },
            data: {
              scheduledDate: update.scheduledDate,
              dayOfWeek: update.dayOfWeek,
              startTime: update.startTime,
              unlockAt: update.unlockAt,
              triggerAt: update.triggerAt,
              status: update.status,
              ...(update.clearTriggerRunId ? { triggerRunId: null } : {}),
            },
          }),
        ),
        ...(updatedStructure
          ? [
              prisma.learningPlan.update({
                where: { id: input.planId },
                data: {
                  planStructure:
                    updatedStructure as unknown as Prisma.InputJsonValue,
                },
              }),
            ]
          : []),
      ]);
    }

    if (jobsToReschedule.length > 0) {
      await reschedulePlanTaskRuns(jobsToReschedule);
    }

    return {
      updatedCount: updates.length,
      updatedStructure,
      jobsToReschedule,
    };
  }

  if (input.planStructure) {
    const updatedStructure = rescheduleRemainingTasks(
      input.planStructure,
      input.targetTaskIdentifier,
      todayIso,
    );

    await prisma.learningPlan.update({
      where: { id: input.planId },
      data: {
        planStructure: updatedStructure as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      updatedCount: 0,
      updatedStructure,
      jobsToReschedule: [],
    };
  }

  return {
    updatedCount: 0,
    updatedStructure: null,
    jobsToReschedule: [],
  };
}
