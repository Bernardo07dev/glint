"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import {
  getTaskStatus,
  getTodayIsoInTimezone,
  parsePlanStructure,
  rescheduleRemainingTasks,
  type DifficultyFeedback,
} from "@/lib/plan-structure";

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

  const todayIso = getTodayIsoInTimezone(
    structure.routineContract?.timezone || user.timezone,
  );
  const updated = rescheduleRemainingTasks(structure, input.taskId, todayIso);

  await prisma.learningPlan.update({
    where: { id: plan.id },
    data: {
      planStructure: updated as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/home");
  revalidatePath("/planos");
  revalidatePath(`/planos/${plan.id}`);

  return { success: true };
}
