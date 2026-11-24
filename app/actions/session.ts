"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import {
  getTaskStatus,
  parsePlanStructure,
  type DifficultyFeedback,
} from "@/lib/plan-structure";
import { enrichPlanTaskDirect } from "@/lib/enrich-plan-task";
import { parseTaskContent, type TaskContent } from "@/lib/task-content";
import { reschedulePlanTasks } from "@/lib/task-reschedule";

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
    },
  });

  if (!planTask) {
    return { success: false, error: "Sessão não encontrada no plano" };
  }

  if (planTask.enrichmentStatus === "READY") {
    const parsed = parseTaskContent(planTask.content);
    if (parsed) {
      return { success: true, content: parsed, enrichmentStatus: "READY" };
    }
  }

  try {
    const result = await enrichPlanTaskDirect(planTask.id);

    revalidatePath("/home");
    revalidatePath(`/planos/${plan.id}`);
    revalidatePath(`/planos/${plan.id}/tasks/${planTask.taskKey}`);

    if (result.content) {
      return {
        success: true,
        content: result.content,
        enrichmentStatus: "READY",
      };
    }

    const refreshed = await prisma.planTask.findUnique({
      where: { id: planTask.id },
      select: { enrichmentStatus: true, content: true },
    });
    const parsed = parseTaskContent(refreshed?.content);
    return {
      success: Boolean(parsed),
      ...(parsed ? { content: parsed } : {}),
      enrichmentStatus: refreshed?.enrichmentStatus ?? "GENERATING",
      ...(!parsed ? { error: "Sessão ainda está sendo preparada" } : {}),
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

export async function recordStepProgressAction(input: {
  planId: string;
  taskIdentifier: string;
  stepId: string;
}): Promise<{ success: boolean; completedSteps?: string[]; error?: string }> {
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
    },
  });

  if (!planTask) return { success: false, error: "Sessão não encontrada" };

  const nextSteps = Array.from(
    new Set([...planTask.completedSteps, input.stepId]),
  );

  await prisma.planTask.update({
    where: { id: planTask.id },
    data: {
      completedSteps: nextSteps,
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
    }
    totalTasks = structure.tasks.length;
    completedTasks = structure.tasks.filter(
      (t) => getTaskStatus(t) === "completed",
    ).length;
  }

  const isPlanCompleted = totalTasks > 0 && completedTasks >= totalTasks;

  await prisma.$transaction([
    prisma.planTask.update({
      where: { id: planTask.id },
      data: {
        status: "COMPLETED",
        completedAt: now,
        difficultyRating: input.difficultyRating,
        userNotes: input.userNotes?.trim() || null,
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

  revalidatePath("/home");
  revalidatePath("/planos");
  revalidatePath(`/planos/${plan.id}`);
  revalidatePath(`/planos/${plan.id}/tasks/${planTask.taskKey}`);

  return { success: true, planCompleted: isPlanCompleted };
}
