import { Prisma } from "@prisma/client";
import { parsePlanStructure } from "@/lib/plan/plan-structure";
import { prisma } from "@/lib/infra/prisma";
import {
  runEnrichTaskPipeline,
  type StepAgentTaskContext,
} from "@/lib/step-agents";
import {
  buildInitialStepProgressCreateManyInput,
  parseStepQuizProgress,
} from "@/lib/tasks/step-progress";
import {
  parseTaskContent,
  TaskContentSchema,
  type TaskContent,
} from "@/lib/tasks/task-content";

export interface EnrichPlanTaskDirectResult {
  skipped: boolean;
  planTaskId: string;
  taskKey?: string;
  content?: TaskContent;
  jevAlignmentScore?: number;
}

/**
 * Shared atomic JIT enrichment executor used by both the Trigger.dev worker
 * (`trigger/enrich-plan-task.ts`) and the direct On-Demand Server Action
 * (`enrichTaskNowAction`).
 */
export async function enrichPlanTaskDirect(
  planTaskId: string,
): Promise<EnrichPlanTaskDirectResult> {
  const lock = await prisma.planTask.updateMany({
    where: {
      id: planTaskId,
      enrichmentStatus: { in: ["PENDING", "FAILED"] },
    },
    data: {
      enrichmentStatus: "GENERATING",
    },
  });

  if (lock.count === 0) {
    return { skipped: true, planTaskId };
  }

  try {
    const planTask = await prisma.planTask.findUnique({
      where: { id: planTaskId },
      include: { plan: true },
    });

    if (!planTask) {
      throw new Error(`PlanTask ${planTaskId} não encontrada.`);
    }

    const previousTask =
      planTask.order > 1
        ? await prisma.planTask.findUnique({
            where: {
              planId_order: {
                planId: planTask.planId,
                order: planTask.order - 1,
              },
            },
            select: {
              title: true,
              durationMinutes: true,
              difficultyRating: true,
              userNotes: true,
              content: true,
              stepProgress: {
                orderBy: { order: "asc" },
              },
            },
          })
        : null;

    const previousTaskTelemetry = (() => {
      if (!previousTask) return null;

      const prevContent = parseTaskContent(previousTask.content);
      const quizQuestionsById = new Map(
        (prevContent?.tools.active_recall_quiz?.questions ?? []).map((q) => [
          q.id,
          q.question,
        ]),
      );

      let actualTimeSpentSeconds = 0;
      let checklistCompletedItems = 0;
      let checklistTotalItems = 0;
      let quizFirstAttemptScore: { correct: number; total: number } | null =
        null;
      const quizWrongQuestions: string[] = [];

      const stepTelemetry = previousTask.stepProgress.map((sp) => {
        actualTimeSpentSeconds += sp.timeSpentSeconds;
        checklistCompletedItems += sp.checkedItems.length;
        checklistTotalItems += sp.totalChecklistItems;

        if (sp.toolType === "active_recall_quiz" && sp.quizData) {
          const parsedQuiz = parseStepQuizProgress(sp.quizData);
          if (parsedQuiz?.firstAttemptScore) {
            quizFirstAttemptScore = parsedQuiz.firstAttemptScore;
          }
          for (const qId of parsedQuiz?.firstAttemptWrongQuestionIds ?? []) {
            const qText = quizQuestionsById.get(qId) ?? qId;
            if (!quizWrongQuestions.includes(qText)) {
              quizWrongQuestions.push(qText);
            }
          }
        }

        return {
          stepId: sp.stepId,
          title: sp.title,
          toolType: sp.toolType,
          estimatedMinutes: sp.estimatedMinutes,
          timeSpentSeconds: sp.timeSpentSeconds,
          checkedCount: sp.checkedItems.length,
          totalChecklistItems: sp.totalChecklistItems,
          status: sp.status,
        };
      });

      return {
        previousTaskTitle: previousTask.title,
        difficultyRating: previousTask.difficultyRating,
        userNotes: previousTask.userNotes,
        estimatedDurationMinutes: previousTask.durationMinutes,
        actualTimeSpentSeconds,
        checklistCompletedItems,
        checklistTotalItems,
        quizFirstAttemptScore,
        quizWrongQuestions,
        stepTelemetry,
      };
    })();

    const context: StepAgentTaskContext = {
      planId: planTask.planId,
      taskKey: planTask.taskKey,
      order: planTask.order,
      title: planTask.title,
      whyItMatters: planTask.whyItMatters,
      taskType: planTask.taskType,
      requiredTools: planTask.requiredTools,
      searchQueryUsed: planTask.searchQueryUsed,
      durationMinutes: planTask.durationMinutes,
      consumeMinutes: planTask.consumeMinutes,
      practiceMinutes: planTask.practiceMinutes,
      refinedGoal: planTask.plan.refinedGoal ?? planTask.plan.rawInput,
      rawInput: planTask.plan.rawInput,
      executableMeta:
        planTask.plan.executableMeta &&
        typeof planTask.plan.executableMeta === "object"
          ? (planTask.plan.executableMeta as Record<string, unknown>)
          : null,
      previousFeedback: previousTaskTelemetry,
    };

    const result = await runEnrichTaskPipeline(context, {
      onBlueprintReady: async (stepsPlan) => {
        await prisma.planTask.update({
          where: { id: planTask.id },
          data: {
            stepsPlan: stepsPlan as unknown as Prisma.InputJsonValue,
          },
        });
      },
    });

    const validatedContent = TaskContentSchema.parse(result.content);

    const latestPlan = await prisma.learningPlan.findUnique({
      where: { id: planTask.planId },
      select: { planStructure: true },
    });
    const structure = parsePlanStructure(latestPlan?.planStructure);

    const updatedStructure = structure
      ? {
          ...structure,
          tasks: structure.tasks.map((taskItem) => {
            if (
              taskItem.taskId !== planTask.taskKey &&
              taskItem.order !== planTask.order
            ) {
              return taskItem;
            }

            return {
              ...taskItem,
              content: validatedContent,
              backgroundWorker: {
                ...(taskItem.backgroundWorker ?? {}),
                enrichmentStatus: "completed",
                searchQueryUsed: planTask.searchQueryUsed,
                jevAlignmentScore: result.jevAlignmentScore,
              },
            };
          }),
        }
      : null;

    const sortedSteps = [...validatedContent.steps].sort(
      (a, b) => a.order - b.order,
    );
    const firstStepId = sortedSteps[0]?.id ?? null;
    const stepProgressPayload = buildInitialStepProgressCreateManyInput(
      planTask.id,
      validatedContent,
      [],
    );

    await prisma.$transaction([
      prisma.planTaskStepProgress.deleteMany({
        where: { taskId: planTask.id },
      }),
      ...(stepProgressPayload.length > 0
        ? [
            prisma.planTaskStepProgress.createMany({
              data: stepProgressPayload,
            }),
          ]
        : []),
      prisma.planTask.update({
        where: { id: planTask.id },
        data: {
          stepsPlan: result.stepsPlan as unknown as Prisma.InputJsonValue,
          content: validatedContent as unknown as Prisma.InputJsonValue,
          jevAlignmentScore: result.jevAlignmentScore,
          enrichmentStatus: "READY",
          enrichedAt: new Date(),
          currentStepId: firstStepId,
        },
      }),
      ...(updatedStructure
        ? [
            prisma.learningPlan.update({
              where: { id: planTask.planId },
              data: {
                planStructure:
                  updatedStructure as unknown as Prisma.InputJsonValue,
              },
            }),
          ]
        : []),
    ]);

    return {
      skipped: false,
      planTaskId: planTask.id,
      taskKey: planTask.taskKey,
      content: validatedContent,
      jevAlignmentScore: result.jevAlignmentScore,
    };
  } catch (error) {
    await prisma.planTask.updateMany({
      where: {
        id: planTaskId,
        enrichmentStatus: "GENERATING",
      },
      data: {
        enrichmentStatus: "FAILED",
      },
    });
    throw error;
  }
}
