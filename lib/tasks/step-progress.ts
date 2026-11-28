import { Prisma, type PlanTaskStepProgress } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/infra/prisma";
import type { TaskContent } from "@/lib/tasks/task-content";

export const StepQuizAttemptSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  isCorrect: z.boolean(),
  isRetry: z.boolean(),
  answeredAt: z.string().min(1),
});

export const StepQuizProgressSchema = z.object({
  activeQuestionId: z.string().nullable(),
  selectedOptionId: z.string().nullable().default(null),
  phase: z.enum(["answering", "confirmed"]),
  isRetryRound: z.boolean(),
  completed: z.boolean(),
  questionQueueIds: z.array(z.string().min(1)).default([]),
  currentRoundWrongQuestionIds: z.array(z.string().min(1)).default([]),
  firstAttemptScore: z
    .object({
      correct: z.number().int().nonnegative(),
      total: z.number().int().positive(),
    })
    .optional(),
  firstAttemptWrongQuestionIds: z.array(z.string().min(1)).default([]),
  attempts: z.array(StepQuizAttemptSchema).default([]),
});

export type StepQuizAttempt = z.infer<typeof StepQuizAttemptSchema>;
export type StepQuizProgress = z.infer<typeof StepQuizProgressSchema>;

export interface ClientStepProgressItem {
  stepId: string;
  order: number;
  phase: string;
  toolType: string;
  title: string;
  estimatedMinutes: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  totalChecklistItems: number;
  checkedItems: number[];
  timeSpentSeconds: number;
  quizData: StepQuizProgress | null;
}

export function parseStepQuizProgress(raw: unknown): StepQuizProgress | null {
  if (raw == null) return null;
  const parsed = StepQuizProgressSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function serializeStepProgress(
  rows: PlanTaskStepProgress[],
): ClientStepProgressItem[] {
  return [...rows]
    .sort((a, b) => a.order - b.order)
    .map((row) => ({
      stepId: row.stepId,
      order: row.order,
      phase: row.phase,
      toolType: row.toolType,
      title: row.title,
      estimatedMinutes: row.estimatedMinutes,
      status: row.status,
      totalChecklistItems: row.totalChecklistItems,
      checkedItems: Array.isArray(row.checkedItems) ? row.checkedItems : [],
      timeSpentSeconds: row.timeSpentSeconds,
      quizData: parseStepQuizProgress(row.quizData),
    }));
}

export function buildInitialStepProgressCreateManyInput(
  taskId: string,
  content: TaskContent,
  completedSteps: string[] = [],
): Prisma.PlanTaskStepProgressCreateManyInput[] {
  const completedSet = new Set(completedSteps);
  const sortedSteps = [...content.steps].sort((a, b) => a.order - b.order);

  return sortedSteps.map((step, idx) => {
    const isCompleted = completedSet.has(step.id);
    const totalChecklistItems = step.walkthrough.length;
    const allIndices = Array.from(
      { length: totalChecklistItems },
      (_, i) => i,
    );

    const isQuiz = step.toolRef === "active_recall_quiz";
    const quizQuestions = content.tools.active_recall_quiz?.questions ?? [];

    const completedQuizData: StepQuizProgress | null =
      isCompleted && isQuiz
        ? {
            activeQuestionId: null,
            selectedOptionId: null,
            phase: "confirmed",
            isRetryRound: false,
            completed: true,
            questionQueueIds: quizQuestions.map((q) => q.id),
            currentRoundWrongQuestionIds: [],
            firstAttemptScore:
              quizQuestions.length > 0
                ? { correct: quizQuestions.length, total: quizQuestions.length }
                : undefined,
            firstAttemptWrongQuestionIds: [],
            attempts: [],
          }
        : null;

    return {
      taskId,
      stepId: step.id,
      order: idx,
      phase: step.phase,
      toolType: step.toolRef,
      title: step.title,
      estimatedMinutes: Math.max(1, Math.round(step.estimatedMinutes)),
      status: isCompleted ? "COMPLETED" : "PENDING",
      totalChecklistItems,
      checkedItems: isCompleted ? allIndices : [],
      timeSpentSeconds: 0,
      completedAt: isCompleted ? new Date() : null,
      quizData: completedQuizData
        ? (completedQuizData as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull,
    };
  });
}

/**
 * Ensures `PlanTaskStepProgress` rows exist for a `READY` task (backfill for tasks
 * created before the migration or missing rows).
 */
export async function ensureTaskStepProgress(input: {
  taskId: string;
  content: TaskContent;
  completedSteps?: string[];
  currentStepId?: string | null;
   existingRows?: PlanTaskStepProgress[];
}): Promise<{
  rows: PlanTaskStepProgress[];
  currentStepId: string | null;
}> {
  const sortedSteps = [...input.content.steps].sort(
    (a, b) => a.order - b.order,
  );
  const existing =
    input.existingRows ??
    (await prisma.planTaskStepProgress.findMany({
      where: { taskId: input.taskId },
      orderBy: { order: "asc" },
    }));

  if (existing.length === sortedSteps.length && existing.length > 0) {
    const validCurrent =
      input.currentStepId &&
      sortedSteps.some((s) => s.id === input.currentStepId)
        ? input.currentStepId
        : (existing.find((r) => r.status !== "COMPLETED")?.stepId ??
          sortedSteps[0]?.id ??
          null);

    return { rows: existing, currentStepId: validCurrent };
  }

  const createPayload = buildInitialStepProgressCreateManyInput(
    input.taskId,
    input.content,
    input.completedSteps ?? [],
  );

  const firstPendingStepId =
    createPayload.find((r) => r.status !== "COMPLETED")?.stepId ??
    sortedSteps[0]?.id ??
    null;

  await prisma.$transaction([
    prisma.planTaskStepProgress.deleteMany({
      where: { taskId: input.taskId },
    }),
    ...(createPayload.length > 0
      ? [
          prisma.planTaskStepProgress.createMany({
            data: createPayload,
          }),
        ]
      : []),
    prisma.planTask.update({
      where: { id: input.taskId },
      data: { currentStepId: firstPendingStepId },
    }),
  ]);

  const rows = await prisma.planTaskStepProgress.findMany({
    where: { taskId: input.taskId },
    orderBy: { order: "asc" },
  });

  return { rows, currentStepId: firstPendingStepId };
}
