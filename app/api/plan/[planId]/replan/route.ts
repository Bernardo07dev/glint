import { runs } from "@trigger.dev/sdk/v3";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  partitionPlanTasks,
  runReplanTurn,
  type ReplanPreview,
} from "@/lib/agents/replan";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/infra/prisma";
import {
  reschedulePlanTaskRuns,
  schedulePlanTasksOnAccept,
} from "@/lib/infra/trigger-jobs";
import { updateLearnerContext } from "@/lib/plan/learner-context";
import {
  getTodayIsoInTimezone,
  parsePlanStructure,
  type PlanStructure,
  type PlanTask as PlanStructureTask,
} from "@/lib/plan/plan-structure";
import {
  findScheduleConflicts,
  getOccupiedSlots,
} from "@/lib/schedule/occupied-slots";
import {
  computeTriggerAt,
  computeUnlockAt,
  normalizeTimeZone,
  resolveInitialTaskStatus,
} from "@/lib/schedule/task-schedule";

export const maxDuration = 60;

const ScheduleSlotSchema = z.object({
  day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  startTime: z.string().min(4),
  durationMinutes: z.number().int().positive(),
});

const TurnRequestSchema = z.object({
  mode: z.literal("turn"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(3000),
      }),
    )
    .min(1)
    .max(20),
  updatedSlots: z.array(ScheduleSlotSchema).optional(),
});

const ApplyRequestSchema = z.object({
  mode: z.literal("apply"),
  preview: z.object({
    strategy: z.enum(["SCHEDULE_ONLY", "PARTIAL_REPLAN", "GOAL_PIVOT"]),
    reasonSummary: z.string().min(1),
    summaryOfChanges: z.array(z.string()),
    keptCompletedCount: z.number().int().nonnegative(),
    objective: z.object({
      rawInput: z.string(),
      clearGoal: z.string().min(1),
      successCriteria: z.array(z.string()),
    }),
    routineContract: z.object({
      timezone: z.string(),
      totalWeeks: z.number().int().positive(),
      weeklyHours: z.number().nonnegative(),
      slots: z.array(
        z.object({
          dayOfWeek: z.string(),
          startTime: z.string(),
          maxMinutes: z.number().int().positive(),
        }),
      ),
    }),
    newFutureTasks: z.array(
      z.object({
        existingTaskId: z.string().optional(),
        taskKey: z.string().min(1),
        order: z.number().int().positive(),
        title: z.string().min(1),
        whyItMatters: z.string().min(1),
        taskType: z.string().min(1),
        requiredTools: z.array(
          z.enum(["video", "concept_explainer", "active_recall_quiz"]),
        ),
        searchQueryUsed: z.string(),
        scheduledDate: z.string().min(10),
        dayOfWeek: z.string().min(3),
        startTime: z.string().min(4),
        durationMinutes: z.number().int().positive(),
        consumeMinutes: z.number().int().nonnegative(),
        practiceMinutes: z.number().int().nonnegative(),
        preserveContent: z.boolean().optional(),
      }),
    ),
  }),
});

const ReplanRequestSchema = z.discriminatedUnion("mode", [
  TurnRequestSchema,
  ApplyRequestSchema,
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ planId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { planId } = await context.params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const parsed = ReplanRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Payload inválido.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const plan = await prisma.learningPlan.findFirst({
    where: { id: planId, userId: user.id },
    include: {
      user: { select: { timezone: true } },
      tasks: {
        orderBy: { order: "asc" },
        include: {
          stepProgress: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!plan || !plan.complete) {
    return Response.json(
      { error: "Plano ativo não encontrado." },
      { status: 404 },
    );
  }

  const currentStructure = parsePlanStructure(plan.planStructure);
  if (!currentStructure) {
    return Response.json(
      { error: "Estrutura do plano indisponível para replan." },
      { status: 422 },
    );
  }

  const timezone = normalizeTimeZone(
    currentStructure.routineContract?.timezone ?? plan.user.timezone,
  );
  const todayIso = getTodayIsoInTimezone(timezone);
  const occupiedSlots = await getOccupiedSlots(user.id, plan.id);
  const { frozenTasks, mutableTasks, nextOrderStart } = partitionPlanTasks(
    plan.tasks,
  );

  // MODO 1: TURN (conversa efêmera + geração do preview)
  if (parsed.data.mode === "turn") {
    try {
      const result = await runReplanTurn({
        planTitle: plan.refinedGoal ?? plan.rawInput,
        rawInput: plan.rawInput,
        currentStructure,
        frozenTasks,
        mutableTasks,
        nextOrderStart,
        occupiedSlots,
        todayIso,
        timezone,
        messages: parsed.data.messages,
        updatedSlots: parsed.data.updatedSlots,
      });

      return Response.json(result);
    } catch (err) {
      console.error("[replan] Erro no modo turn:", err);
      return Response.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Erro interno ao analisar o ajuste do plano.",
        },
        { status: 500 },
      );
    }
  }

  // MODO 2: APPLY (validação + transação Prisma + PlanReplan + Trigger.dev)
  try {
  const preview: ReplanPreview = parsed.data.preview;

  const conflicts = findScheduleConflicts(
    preview.routineContract.slots.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      durationMinutes: s.maxMinutes,
    })),
    occupiedSlots,
  );
  if (conflicts.length > 0) {
    return Response.json(
      {
        error: "Alguns horários escolhidos conflitam com outros planos ativos.",
        conflicts,
      },
      { status: 409 },
    );
  }

  const oldTriggerRunIds = mutableTasks
    .map((t) => t.triggerRunId)
    .filter((id): id is string => Boolean(id));

  const frozenStructureTasks: PlanStructureTask[] = frozenTasks.map((t) => ({
    taskId: t.taskKey,
    order: t.order,
    title: t.title,
    whyItMatters: t.whyItMatters,
    schedule: {
      date: t.scheduledDate,
      dayOfWeek: t.dayOfWeek,
      startTime: t.startTime,
      durationMinutes: t.durationMinutes,
      timeBreakdown: {
        consumeMinutes: t.consumeMinutes,
        practiceMinutes: t.practiceMinutes,
      },
    },
    lockState: {
      isLocked: false,
      unlockAtDate: t.scheduledDate,
    },
    status: t.status === "COMPLETED" ? "completed" : "pending",
    completedAt: t.completedAt?.toISOString() ?? null,
    contentSpec: {
      taskType: t.taskType,
      requiredTools: t.requiredTools,
      searchQueryUsed: t.searchQueryUsed,
    },
  }));

  const newFutureStructureTasks: PlanStructureTask[] =
    preview.newFutureTasks.map((t, idx) => {
      const order = nextOrderStart + idx;
      const isLocked = t.scheduledDate > todayIso;
      return {
        taskId: t.taskKey,
        order,
        title: t.title,
        whyItMatters: t.whyItMatters,
        schedule: {
          date: t.scheduledDate,
          dayOfWeek: t.dayOfWeek,
          startTime: t.startTime,
          durationMinutes: t.durationMinutes,
          timeBreakdown: {
            consumeMinutes: t.consumeMinutes,
            practiceMinutes: t.practiceMinutes,
          },
        },
        lockState: {
          isLocked,
          unlockAtDate: t.scheduledDate,
        },
        status: "pending",
        completedAt: null,
        contentSpec: {
          taskType: t.taskType,
          requiredTools: t.requiredTools,
          searchQueryUsed: t.searchQueryUsed,
        },
      };
    });

  const updatedPlanStructure: PlanStructure = {
    planId: plan.id,
    status: "active",
    objective: preview.objective,
    routineContract: preview.routineContract,
    tasks: [...frozenStructureTasks, ...newFutureStructureTasks],
  };

  const mutableTaskIds = mutableTasks.map((t) => t.id);

  const txResult = await prisma.$transaction(async (tx) => {
    const existingReplanCount = await tx.planReplan.count({
      where: { planId: plan.id },
    });

    await tx.planReplan.create({
      data: {
        planId: plan.id,
        version: existingReplanCount + 1,
        strategy: preview.strategy,
        reasonSummary: preview.reasonSummary,
        oldPlan: currentStructure as unknown as Prisma.InputJsonValue,
        newPlan: updatedPlanStructure as unknown as Prisma.InputJsonValue,
      },
    });

    let createdForTrigger: Array<{ id: string; taskKey: string; triggerAt: Date }> = [];
    const rescheduledDeltas: Array<{
      taskId: string;
      taskKey: string;
      previousTriggerRunId: string | null;
      nextTriggerAt: Date;
    }> = [];

    if (preview.strategy === "SCHEDULE_ONLY") {
      // Atualiza in-place preservando content READY
      for (let idx = 0; idx < preview.newFutureTasks.length; idx++) {
        const item = preview.newFutureTasks[idx];
        const existing = mutableTasks.find(
          (m) => m.id === item.existingTaskId || m.taskKey === item.taskKey,
        );
        if (!existing) continue;

        const unlockAt = computeUnlockAt(item.scheduledDate, timezone);
        const triggerAt = computeTriggerAt(
          item.scheduledDate,
          item.startTime,
          timezone,
        );
        const nextStatus = resolveInitialTaskStatus(
          item.scheduledDate,
          item.scheduledDate > todayIso,
          todayIso,
        );

        await tx.planTask.update({
          where: { id: existing.id },
          data: {
            scheduledDate: item.scheduledDate,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            durationMinutes: item.durationMinutes,
            consumeMinutes: item.consumeMinutes,
            practiceMinutes: item.practiceMinutes,
            unlockAt,
            triggerAt,
            status: nextStatus,
          },
        });

        if (
          existing.enrichmentStatus === "PENDING" ||
          existing.enrichmentStatus === "FAILED"
        ) {
          rescheduledDeltas.push({
            taskId: existing.id,
            taskKey: existing.taskKey,
            previousTriggerRunId: existing.triggerRunId,
            nextTriggerAt: triggerAt,
          });
        }
      }
    } else {
      // PARTIAL_REPLAN ou GOAL_PIVOT: remove futuras antigas e cria novas
      if (mutableTaskIds.length > 0) {
        await tx.planTask.deleteMany({
          where: { id: { in: mutableTaskIds } },
        });
      }

      const rowsToCreate = preview.newFutureTasks.map((item, idx) => {
        const order = nextOrderStart + idx;
        const unlockAt = computeUnlockAt(item.scheduledDate, timezone);
        const triggerAt = computeTriggerAt(
          item.scheduledDate,
          item.startTime,
          timezone,
        );
        const status = resolveInitialTaskStatus(
          item.scheduledDate,
          item.scheduledDate > todayIso,
          todayIso,
        );

        return {
          planId: plan.id,
          taskKey: item.taskKey,
          order,
          title: item.title,
          whyItMatters: item.whyItMatters,
          taskType: item.taskType,
          requiredTools: item.requiredTools,
          searchQueryUsed: item.searchQueryUsed,
          scheduledDate: item.scheduledDate,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          durationMinutes: item.durationMinutes,
          consumeMinutes: item.consumeMinutes,
          practiceMinutes: item.practiceMinutes,
          unlockAt,
          triggerAt,
          enrichmentStatus: "PENDING" as const,
          status,
        };
      });

      if (rowsToCreate.length > 0) {
        createdForTrigger = await tx.planTask.createManyAndReturn({
          data: rowsToCreate,
          select: { id: true, taskKey: true, triggerAt: true },
        });
      }
    }

    await tx.learningPlan.update({
      where: { id: plan.id },
      data: {
        planStructure: updatedPlanStructure as unknown as Prisma.InputJsonValue,
        refinedGoal: preview.objective.clearGoal,
        totalTasks: frozenTasks.length + preview.newFutureTasks.length,
      },
    });

    return { createdForTrigger, rescheduledDeltas };
  });

  // Pós-commit: reconciliação no Trigger.dev (fora da transação)
  if (preview.strategy === "SCHEDULE_ONLY") {
    if (txResult.rescheduledDeltas.length > 0) {
      await reschedulePlanTaskRuns(txResult.rescheduledDeltas).catch((err) =>
        console.error("[replan] Falha ao reagendar runs no Trigger.dev:", err),
      );
    }
  } else {
    if (oldTriggerRunIds.length > 0) {
      await Promise.allSettled(
        oldTriggerRunIds.map((runId) => runs.cancel(runId)),
      );
    }
    if (txResult.createdForTrigger.length > 0) {
      await schedulePlanTasksOnAccept(txResult.createdForTrigger).catch((err) =>
        console.error("[replan] Falha ao agendar novos runs no Trigger.dev:", err),
      );
    }
  }

  // Atualiza knowledgeGraph em background se houve mudança de perfil/conteúdo/objetivo
  if (preview.strategy !== "SCHEDULE_ONLY") {
    void updateLearnerContext(user.id).catch((err) =>
      console.error("[replan] Falha ao atualizar knowledgeGraph:", err),
    );
  }

  return Response.json({
    success: true,
    planId: plan.id,
    strategy: preview.strategy,
    totalTasks: frozenTasks.length + preview.newFutureTasks.length,
  });
  } catch (err) {
    console.error("[replan] Erro no modo apply:", err);
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro interno ao aplicar as mudanças no plano.",
      },
      { status: 500 },
    );
  }
}
