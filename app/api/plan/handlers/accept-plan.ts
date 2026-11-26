import type { Prisma } from "@prisma/client";
import type { PlanStructure } from "@/lib/agents/types";
import {
  findScheduleConflicts,
  getOccupiedSlots,
} from "@/lib/schedule/occupied-slots";
import { getTodayIsoInTimezone } from "@/lib/plan/plan-structure";
import { prisma } from "@/lib/infra/prisma";
import {
  computeTriggerAt,
  computeUnlockAt,
  normalizeTimeZone,
  resolveInitialTaskStatus,
} from "@/lib/schedule/task-schedule";
import { schedulePlanTasksOnAccept } from "@/lib/infra/trigger-jobs";
import { hasPlanStructure } from "./generating-tasks";

export function buildPlanTaskRows(
  planId: string,
  planStructure: PlanStructure,
  timeZone: string,
  todayIso: string,
): Prisma.PlanTaskCreateManyInput[] {
  const sortedTasks = [...planStructure.tasks].sort(
    (a, b) => a.order - b.order,
  );

  return sortedTasks.map((task) => ({
    planId,
    taskKey: task.taskId,
    order: task.order,
    title: task.title,
    whyItMatters: task.whyItMatters,
    taskType: task.pedagogy.taskType,
    requiredTools: task.pedagogy.requiredTools,
    searchQueryUsed: task.backgroundWorker.searchQueryUsed,
    scheduledDate: task.schedule.date,
    dayOfWeek: task.schedule.dayOfWeek,
    startTime: task.schedule.startTime,
    durationMinutes: task.schedule.durationMinutes,
    consumeMinutes: task.schedule.timeBreakdown.consumeMinutes,
    practiceMinutes: task.schedule.timeBreakdown.practiceMinutes,
    unlockAt: computeUnlockAt(task.schedule.date, timeZone),
    triggerAt: computeTriggerAt(
      task.schedule.date,
      task.schedule.startTime,
      timeZone,
    ),
    enrichmentStatus: "PENDING",
    status: resolveInitialTaskStatus(
      task.schedule.date,
      task.lockState.isLocked,
      todayIso,
    ),
  }));
}

export async function handleAcceptPlanStage(input: {
  planId: string;
  planStructure: unknown;
  userId?: string;
  userTimezone?: string | null;
}) {
  if (!hasPlanStructure(input.planStructure)) {
    return {
      ok: false as const,
      status: 400,
      error: "O plano ainda não possui sessões geradas",
    };
  }

  if (input.userId) {
    const occupiedSlots = await getOccupiedSlots(
      input.userId,
      input.planId,
    );
    const newSlots = input.planStructure.tasks.map((task) => ({
      dayOfWeek: task.schedule.dayOfWeek,
      startTime: task.schedule.startTime,
      durationMinutes: task.schedule.durationMinutes,
    }));
    const conflicts = findScheduleConflicts(newSlots, occupiedSlots);

    if (conflicts.length > 0) {
      return {
        ok: false as const,
        status: 409,
        error:
          "Este plano agenda sessões em horários já reservados por outro plano ativo. Ajuste o cronograma para continuar.",
        conflicts,
      };
    }
  }

  const timeZone = normalizeTimeZone(
    input.planStructure.routineContract?.timezone || input.userTimezone,
  );
  const todayIso = getTodayIsoInTimezone(timeZone);
  const rows = buildPlanTaskRows(
    input.planId,
    input.planStructure,
    timeZone,
    todayIso,
  );

  const [, , , createdTasks] = await prisma.$transaction([
    prisma.planTask.deleteMany({
      where: { planId: input.planId },
    }),
    prisma.planTask.createMany({
      data: rows,
    }),
    prisma.learningPlan.update({
      where: { id: input.planId },
      data: {
        stage: "ACTIVE",
        complete: true,
        totalTasks: rows.length,
      },
    }),
    prisma.planTask.findMany({
      where: { planId: input.planId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        taskKey: true,
        triggerAt: true,
      },
    }),
  ]);

  await schedulePlanTasksOnAccept(createdTasks);

  return {
    ok: true as const,
    stage: "ACTIVE" as const,
    redirectTo: "/home",
    createdTasks,
  };
}
