"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { runs } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/infra/prisma";
import { getSessionUser } from "@/lib/auth/session";
import {
  getTaskStatus,
  parsePlanStructure,
  type DifficultyFeedback,
} from "@/lib/plan/plan-structure";
import { rebuildLearnerContext } from "@/lib/plan/learner-context";
import { enrichPlanTaskDirect } from "@/lib/tasks/enrich-plan-task";
import {
  ensureTaskStepProgress,
  parseStepQuizProgress,
  serializeStepProgress,
  StepQuizProgressSchema,
  type ClientStepProgressItem,
  type StepQuizProgress,
} from "@/lib/tasks/step-progress";
import { parseTaskContent, type TaskContent } from "@/lib/tasks/task-content";
import { reschedulePlanTasks } from "@/lib/schedule/task-reschedule";

const MAX_TIME_DELTA_SECONDS = 20 * 60;

function sanitizeDeltaSeconds(raw?: number): number {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(MAX_TIME_DELTA_SECONDS, Math.round(raw));
}

export async function toggleStepAction(input: {
  planId: string;
  taskId: string;
  stepIndex: number;
}): Promise<{ success: boolean; completedSteps?: number[]; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Sessão expirada" };

  const plan = await prisma.learningPlan.findUnique({
    where: { id: input.planId },
  });

  if (!plan || plan.userId !== user.id) {
    return { success: false, error: "Plano não encontrado" };
  }

  const structure = parsePlanStructure(plan.planStructure);
  if (!structure) {
    return { success: false, error: "Estrutura do plano inválida" };
  }

  const taskIdx = structure.tasks.findIndex((t) => t.taskId === input.taskId);
  if (taskIdx === -1) {
    return { success: false, error: "Sessão não encontrada" };
  }

  const task = structure.tasks[taskIdx];
  const currentSteps = new Set<number>(
    Array.isArray(task.completedSteps) ? task.completedSteps : [],
  );

  if (currentSteps.has(input.stepIndex)) {
    currentSteps.delete(input.stepIndex);
  } else {
    currentSteps.add(input.stepIndex);
  }

  const nextCompletedSteps = Array.from(currentSteps).sort((a, b) => a - b);
  const currentStatus = getTaskStatus(task);

  structure.tasks[taskIdx] = {
    ...task,
    completedSteps: nextCompletedSteps,
    status: currentStatus === "pending" ? "in_progress" : currentStatus,
  };

  await prisma.learningPlan.update({
    where: { id: plan.id },
    data: {
      planStructure: structure as unknown as Prisma.InputJsonValue,
    },
  });

  return { success: true, completedSteps: nextCompletedSteps };
}

export async function completeSessionAction(input: {
  planId: string;
  taskId: string;
  feedback: DifficultyFeedback;
}): Promise<{ success: boolean; planCompleted?: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Sessão expirada" };

  const plan = await prisma.learningPlan.findUnique({
    where: { id: input.planId },
  });

  if (!plan || plan.userId !== user.id) {
    return { success: false, error: "Plano não encontrado" };
  }

  const structure = parsePlanStructure(plan.planStructure);
  if (!structure) {
    return { success: false, error: "Estrutura do plano inválida" };
  }

  const taskIdx = structure.tasks.findIndex((t) => t.taskId === input.taskId);
  if (taskIdx === -1) {
    return { success: false, error: "Sessão não encontrada" };
  }

  const nowIso = new Date().toISOString();
  structure.tasks[taskIdx] = {
    ...structure.tasks[taskIdx],
    status: "completed",
    completedAt: nowIso,
    difficultyFeedback: input.feedback,
  };

  const totalTasks = structure.tasks.length;
  const completedTasks = structure.tasks.filter(
    (t) => getTaskStatus(t) === "completed",
  ).length;
  const isPlanCompleted = totalTasks > 0 && completedTasks >= totalTasks;

  await prisma.$transaction([
    prisma.learningPlan.update({
      where: { id: plan.id },
      data: {
        planStructure: structure as unknown as Prisma.InputJsonValue,
        totalTasks,
        completedTasks,
        stage: isPlanCompleted ? "COMPLETED" : plan.stage,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    }),
  ]);

  revalidatePath("/home");
  revalidatePath("/planos");
  revalidatePath(`/planos/${plan.id}`);

  return { success: true, planCompleted: isPlanCompleted };
}

export async function rescheduleTodayAction(input: {
  planId: string;
  taskId: string;
}): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Sessão expirada" };

  const plan = await prisma.learningPlan.findUnique({
    where: { id: input.planId },
  });

  if (!plan || plan.userId !== user.id) {
    return { success: false, error: "Plano não encontrado" };
  }

  const structure = parsePlanStructure(plan.planStructure);
  if (!structure) {
    return { success: false, error: "Estrutura do plano inválida" };
  }

  await reschedulePlanTasks({
    planId: plan.id,
    targetTaskIdentifier: input.taskId,
    planStructure: structure,
    userTimezone: user.timezone,
  });

  revalidatePath("/home");
  revalidatePath("/planos");
  revalidatePath(`/planos/${plan.id}`);

  return { success: true };
}

/**
 * Generates/enriches a `PlanTask` on demand directly on the server
 * (currently open for FREE and PRO plans while Trigger.dev Cloud deploys are pending).
 */
export async function enrichTaskNowAction(input: {
  planId: string;
  taskIdentifier: string;
}): Promise<{
  success: boolean;
  content?: TaskContent;
  stepProgress?: ClientStepProgressItem[];
  currentStepId?: string | null;
  enrichmentStatus?: string;
  error?: string;
}> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Sessão expirada" };

  const plan = await prisma.learningPlan.findFirst({
    where: { id: input.planId, userId: user.id },
    select: { id: true },
  });
  if (!plan) return { success: false, error: "Plano não encontrado" };

  const planTask = await prisma.planTask.findFirst({
    where: {
      planId: plan.id,
      OR: [{ id: input.taskIdentifier }, { taskKey: input.taskIdentifier }],
    },
    select: {
      id: true,
      taskKey: true,
      enrichmentStatus: true,
      content: true,
      completedSteps: true,
      currentStepId: true,
      stepProgress: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!planTask) {
    return { success: false, error: "Sessão não encontrada no plano" };
  }

  if (planTask.enrichmentStatus === "READY") {
    const parsed = parseTaskContent(planTask.content);
    if (parsed) {
      const ensured = await ensureTaskStepProgress({
        taskId: planTask.id,
        content: parsed,
        completedSteps: planTask.completedSteps,
        currentStepId: planTask.currentStepId,
        existingRows: planTask.stepProgress,
      });
      return {
        success: true,
        content: parsed,
        stepProgress: serializeStepProgress(ensured.rows),
        currentStepId: ensured.currentStepId,
        enrichmentStatus: "READY",
      };
    }
  }

  try {
    const result = await enrichPlanTaskDirect(planTask.id);

    revalidatePath("/home");
    revalidatePath(`/planos/${plan.id}`);
    revalidatePath(`/planos/${plan.id}/tasks/${planTask.taskKey}`);

    const refreshed = await prisma.planTask.findUnique({
      where: { id: planTask.id },
      select: {
        enrichmentStatus: true,
        content: true,
        completedSteps: true,
        currentStepId: true,
        stepProgress: {
          orderBy: { order: "asc" },
        },
      },
    });

    const parsed = result.content ?? parseTaskContent(refreshed?.content);
    if (parsed) {
      const ensured = await ensureTaskStepProgress({
        taskId: planTask.id,
        content: parsed,
        completedSteps: refreshed?.completedSteps ?? [],
        currentStepId: refreshed?.currentStepId ?? null,
        existingRows: refreshed?.stepProgress,
      });
      return {
        success: true,
        content: parsed,
        stepProgress: serializeStepProgress(ensured.rows),
        currentStepId: ensured.currentStepId,
        enrichmentStatus: "READY",
      };
    }

    return {
      success: false,
      enrichmentStatus: refreshed?.enrichmentStatus ?? "GENERATING",
      error: "Sessão ainda está sendo preparada",
    };
  } catch (error) {
    console.error("[session] Erro ao enriquecer task sob demanda:", error);
    return {
      success: false,
      enrichmentStatus: "FAILED",
      error: "Não foi possível preparar a sessão agora. Tente novamente.",
    };
  }
}

export async function selectStepAction(input: {
  planId: string;
  taskIdentifier: string;
  fromStepId?: string;
  toStepId: string;
  elapsedSecondsOnPreviousStep?: number;
}): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Sessão expirada" };

  const planTask = await prisma.planTask.findFirst({
    where: {
      planId: input.planId,
      plan: { userId: user.id },
      OR: [{ id: input.taskIdentifier }, { taskKey: input.taskIdentifier }],
    },
    select: {
      id: true,
      status: true,
      stepProgress: {
        where: {
          stepId: {
            in: [input.toStepId, ...(input.fromStepId ? [input.fromStepId] : [])],
          },
        },
      },
    },
  });

  if (!planTask) return { success: false, error: "Sessão não encontrada" };

  const now = new Date();
  const delta = sanitizeDeltaSeconds(input.elapsedSecondsOnPreviousStep);
  const targetRow = planTask.stepProgress.find(
    (r) => r.stepId === input.toStepId,
  );
  const fromRow = input.fromStepId
    ? planTask.stepProgress.find((r) => r.stepId === input.fromStepId)
    : undefined;

  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.planTask.update({
      where: { id: planTask.id },
      data: {
        currentStepId: input.toStepId,
        status:
          planTask.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
      },
    }),
  ];

  if (fromRow && delta > 0 && input.fromStepId !== input.toStepId) {
    ops.push(
      prisma.planTaskStepProgress.update({
        where: { id: fromRow.id },
        data: {
          timeSpentSeconds: { increment: delta },
          lastInteractionAt: now,
        },
      }),
    );
  }

  if (targetRow) {
    ops.push(
      prisma.planTaskStepProgress.update({
        where: { id: targetRow.id },
        data: {
          ...(targetRow.status === "PENDING"
            ? { status: "IN_PROGRESS", startedAt: targetRow.startedAt ?? now }
            : {}),
          lastInteractionAt: now,
          ...(input.fromStepId === input.toStepId && delta > 0
            ? { timeSpentSeconds: { increment: delta } }
            : {}),
        },
      }),
    );
  }

  await prisma.$transaction(ops);
  return { success: true };
}

export async function updateStepChecklistAction(input: {
  planId: string;
  taskIdentifier: string;
  stepId: string;
  checkedItems: number[];
}): Promise<{
  success: boolean;
  checkedItems?: number[];
  error?: string;
}> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Sessão expirada" };

  const planTask = await prisma.planTask.findFirst({
    where: {
      planId: input.planId,
      plan: { userId: user.id },
      OR: [{ id: input.taskIdentifier }, { taskKey: input.taskIdentifier }],
    },
    select: {
      id: true,
      status: true,
      stepProgress: {
        where: { stepId: input.stepId },
        take: 1,
      },
    },
  });

  if (!planTask) return { success: false, error: "Sessão não encontrada" };

  const stepRow = planTask.stepProgress[0];
  if (!stepRow) return { success: false, error: "Passo não encontrado" };

  const maxItems = stepRow.totalChecklistItems;
  const sanitized = Array.from(
    new Set(
      (input.checkedItems ?? []).filter(
        (idx) =>
          Number.isInteger(idx) &&
          idx >= 0 &&
          (maxItems <= 0 || idx < maxItems),
      ),
    ),
  ).sort((a, b) => a - b);

  const now = new Date();

  await prisma.$transaction([
    prisma.planTaskStepProgress.update({
      where: { id: stepRow.id },
      data: {
        checkedItems: { set: sanitized },
        lastInteractionAt: now,
        ...(stepRow.status === "PENDING"
          ? { status: "IN_PROGRESS", startedAt: stepRow.startedAt ?? now }
          : {}),
      },
    }),
    ...(planTask.status === "LOCKED" || planTask.status === "AVAILABLE"
      ? [
          prisma.planTask.update({
            where: { id: planTask.id },
            data: { status: "IN_PROGRESS" },
          }),
        ]
      : []),
  ]);

  return { success: true, checkedItems: sanitized };
}

export async function recordQuizAnswerAction(input: {
  planId: string;
  taskIdentifier: string;
  stepId: string;
  quizProgress: StepQuizProgress;
}): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Sessão expirada" };

  const parsedQuiz = StepQuizProgressSchema.safeParse(input.quizProgress);
  if (!parsedQuiz.success) {
    return { success: false, error: "Dados do quiz inválidos" };
  }

  const planTask = await prisma.planTask.findFirst({
    where: {
      planId: input.planId,
      plan: { userId: user.id },
      OR: [{ id: input.taskIdentifier }, { taskKey: input.taskIdentifier }],
    },
    select: {
      id: true,
      status: true,
      stepProgress: {
        where: { stepId: input.stepId },
        take: 1,
      },
    },
  });

  if (!planTask) return { success: false, error: "Sessão não encontrada" };

  const stepRow = planTask.stepProgress[0];
  if (!stepRow) return { success: false, error: "Passo não encontrado" };

  const now = new Date();

  await prisma.$transaction([
    prisma.planTaskStepProgress.update({
      where: { id: stepRow.id },
      data: {
        quizData: parsedQuiz.data as unknown as Prisma.InputJsonValue,
        lastInteractionAt: now,
        ...(stepRow.status === "PENDING"
          ? { status: "IN_PROGRESS", startedAt: stepRow.startedAt ?? now }
          : {}),
      },
    }),
    ...(planTask.status === "LOCKED" || planTask.status === "AVAILABLE"
      ? [
          prisma.planTask.update({
            where: { id: planTask.id },
            data: { status: "IN_PROGRESS" },
          }),
        ]
      : []),
  ]);

  return { success: true };
}

export async function flushStepTimeAction(input: {
  planId: string;
  taskIdentifier: string;
  stepId: string;
  elapsedSeconds: number;
}): Promise<{ success: boolean }> {
  const delta = sanitizeDeltaSeconds(input.elapsedSeconds);
  if (delta <= 0) return { success: true };

  const user = await getSessionUser();
  if (!user) return { success: false };

  const planTask = await prisma.planTask.findFirst({
    where: {
      planId: input.planId,
      plan: { userId: user.id },
      OR: [{ id: input.taskIdentifier }, { taskKey: input.taskIdentifier }],
    },
    select: {
      id: true,
      stepProgress: {
        where: { stepId: input.stepId },
        take: 1,
      },
    },
  });

  const stepRow = planTask?.stepProgress[0];
  if (!stepRow) return { success: false };

  await prisma.planTaskStepProgress.update({
    where: { id: stepRow.id },
    data: {
      timeSpentSeconds: { increment: delta },
      lastInteractionAt: new Date(),
    },
  });

  return { success: true };
}

export async function recordStepProgressAction(input: {
  planId: string;
  taskIdentifier: string;
  stepId: string;
  nextStepId?: string;
  elapsedSeconds?: number;
  checkedItems?: number[];
  quizProgress?: StepQuizProgress | null;
}): Promise<{
  success: boolean;
  completedSteps?: string[];
  code?: "CHECKLIST_INCOMPLETE" | "QUIZ_INCOMPLETE";
  error?: string;
}> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Sessão expirada" };

  const planTask = await prisma.planTask.findFirst({
    where: {
      planId: input.planId,
      plan: { userId: user.id },
      OR: [{ id: input.taskIdentifier }, { taskKey: input.taskIdentifier }],
    },
    select: {
      id: true,
      status: true,
      completedSteps: true,
      stepProgress: {
        where: {
          stepId: {
            in: [input.stepId, ...(input.nextStepId ? [input.nextStepId] : [])],
          },
        },
      },
    },
  });

  if (!planTask) return { success: false, error: "Sessão não encontrada" };

  const currentRow = planTask.stepProgress.find(
    (r) => r.stepId === input.stepId,
  );
  const nextRow = input.nextStepId
    ? planTask.stepProgress.find((r) => r.stepId === input.nextStepId)
    : undefined;

  if (currentRow) {
    const maxItems = currentRow.totalChecklistItems;
    const effectiveChecked = input.checkedItems
      ? Array.from(
          new Set(
            input.checkedItems.filter(
              (idx) =>
                Number.isInteger(idx) &&
                idx >= 0 &&
                (maxItems <= 0 || idx < maxItems),
            ),
          ),
        ).sort((a, b) => a - b)
      : currentRow.checkedItems;

    if (maxItems > 0 && effectiveChecked.length < maxItems) {
      return {
        success: false,
        code: "CHECKLIST_INCOMPLETE",
        error: `Marque todos os itens do Passo a Passo (${effectiveChecked.length}/${maxItems}) antes de avançar.`,
      };
    }

    const effectiveQuiz = input.quizProgress
      ? parseStepQuizProgress(input.quizProgress)
      : parseStepQuizProgress(currentRow.quizData);

    if (
      currentRow.toolType === "active_recall_quiz" &&
      !effectiveQuiz?.completed
    ) {
      return {
        success: false,
        code: "QUIZ_INCOMPLETE",
        error: "Conclua todas as perguntas do quiz de fixação antes de avançar.",
      };
    }

    const now = new Date();
    const delta = sanitizeDeltaSeconds(input.elapsedSeconds);
    const nextCompletedSteps = Array.from(
      new Set([...planTask.completedSteps, input.stepId]),
    );

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.planTaskStepProgress.update({
        where: { id: currentRow.id },
        data: {
          status: "COMPLETED",
          checkedItems: { set: effectiveChecked },
          ...(effectiveQuiz
            ? {
                quizData:
                  effectiveQuiz as unknown as Prisma.InputJsonValue,
              }
            : {}),
          ...(delta > 0 ? { timeSpentSeconds: { increment: delta } } : {}),
          startedAt: currentRow.startedAt ?? now,
          completedAt: currentRow.completedAt ?? now,
          lastInteractionAt: now,
        },
      }),
      prisma.planTask.update({
        where: { id: planTask.id },
        data: {
          completedSteps: nextCompletedSteps,
          currentStepId: input.nextStepId ?? input.stepId,
          status:
            planTask.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
        },
      }),
    ];

    if (nextRow && nextRow.status === "PENDING") {
      ops.push(
        prisma.planTaskStepProgress.update({
          where: { id: nextRow.id },
          data: {
            status: "IN_PROGRESS",
            startedAt: nextRow.startedAt ?? now,
            lastInteractionAt: now,
          },
        }),
      );
    }

    await prisma.$transaction(ops);
    return { success: true, completedSteps: nextCompletedSteps };
  }

  const nextSteps = Array.from(
    new Set([...planTask.completedSteps, input.stepId]),
  );

  await prisma.planTask.update({
    where: { id: planTask.id },
    data: {
      completedSteps: nextSteps,
      currentStepId: input.nextStepId ?? input.stepId,
      status: planTask.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
    },
  });

  return { success: true, completedSteps: nextSteps };
}

export async function finishTaskSessionAction(input: {
  planId: string;
  taskIdentifier: string;
  difficultyRating: "too_easy" | "just_right" | "too_hard";
  userNotes?: string;
}): Promise<{ success: boolean; planCompleted?: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Sessão expirada" };

  const plan = await prisma.learningPlan.findFirst({
    where: { id: input.planId, userId: user.id },
  });
  if (!plan) return { success: false, error: "Plano não encontrado" };

  const planTask = await prisma.planTask.findFirst({
    where: {
      planId: plan.id,
      OR: [{ id: input.taskIdentifier }, { taskKey: input.taskIdentifier }],
    },
  });
  if (!planTask) return { success: false, error: "Sessão não encontrada" };

  const now = new Date();
  const mappedFeedback: DifficultyFeedback =
    input.difficultyRating === "too_easy"
      ? "easy"
      : input.difficultyRating === "too_hard"
        ? "hard"
        : "just_right";

  const structure = parsePlanStructure(plan.planStructure);
  let totalTasks = plan.totalTasks;
  let completedTasks = plan.completedTasks;

  if (structure) {
    const idx = structure.tasks.findIndex(
      (t) => t.taskId === planTask.taskKey || t.order === planTask.order,
    );
    if (idx !== -1) {
      structure.tasks[idx] = {
        ...structure.tasks[idx],
        status: "completed",
        completedAt: now.toISOString(),
        difficultyFeedback: mappedFeedback,
      };
      if (idx + 1 < structure.tasks.length) {
        structure.tasks[idx + 1] = {
          ...structure.tasks[idx + 1],
          lockState: {
            ...structure.tasks[idx + 1].lockState,
            isLocked: false,
          },
        };
      }
    }
    totalTasks = structure.tasks.length;
    completedTasks = structure.tasks.filter(
      (t) => getTaskStatus(t) === "completed",
    ).length;
  }

  const isPlanCompleted = totalTasks > 0 && completedTasks >= totalTasks;

  if (planTask.triggerRunId) {
    await runs.cancel(planTask.triggerRunId).catch(() => null);
  }

  await prisma.$transaction([
    prisma.planTask.update({
      where: { id: planTask.id },
      data: {
        status: "COMPLETED",
        completedAt: now,
        difficultyRating: input.difficultyRating,
        userNotes: input.userNotes?.trim() || null,
        triggerRunId: null,
      },
    }),
    prisma.learningPlan.update({
      where: { id: plan.id },
      data: {
        ...(structure
          ? { planStructure: structure as unknown as Prisma.InputJsonValue }
          : {}),
        totalTasks,
        completedTasks,
        stage: isPlanCompleted ? "COMPLETED" : plan.stage,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: now },
    }),
  ]);

  // Atualiza o Knowledge Graph do aluno em background com a telemetria real da sessão concluída
  void rebuildLearnerContext(user.id).catch((err) =>
    console.error("[session] Falha ao atualizar knowledgeGraph pós-sessão:", err),
  );

  revalidatePath("/home");
  revalidatePath("/planos");
  revalidatePath(`/planos/${plan.id}`);
  revalidatePath(`/planos/${plan.id}/tasks/${planTask.taskKey}`);

  return { success: true, planCompleted: isPlanCompleted };
}
