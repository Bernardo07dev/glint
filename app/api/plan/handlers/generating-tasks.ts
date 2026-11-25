import type { Prisma } from "@prisma/client";
import { runGeneratingTasksAgent } from "@/lib/agents/generating-tasks";
import type { ExecutableMeta, PlanStructure } from "@/lib/agents/types";
import type { OccupiedSlot } from "@/lib/occupied-slots";
import { prisma } from "@/lib/prisma";

export function hasPlanStructure(value: unknown): value is PlanStructure {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as PlanStructure).tasks) &&
    (value as PlanStructure).tasks.length > 0
  );
}

export async function handleGeneratingTasksStage(input: {
  planId: string;
  rawInput: string;
  refinedGoal: string;
  executableMeta: ExecutableMeta;
  feedback?: string;
  priorFeedbacks?: string[];
  previousPlanStructure?: PlanStructure | null;
  occupiedSlots?: OccupiedSlot[];
}) {
  let adjustmentFeedback = input.priorFeedbacks ?? [];

  if (input.feedback) {
    await prisma.planMessage.create({
      data: {
        planId: input.planId,
        role: "USER",
        stage: "GENERATING_TASKS",
        content: input.feedback,
      },
    });
    adjustmentFeedback = [...adjustmentFeedback, input.feedback];
  }

  const planStructure = await runGeneratingTasksAgent({
    planId: input.planId,
    rawInput: input.rawInput,
    refinedGoal: input.refinedGoal,
    executableMeta: input.executableMeta,
    previousPlanStructure: input.previousPlanStructure,
    adjustmentFeedback,
    occupiedSlots: input.occupiedSlots,
  });

  await prisma.learningPlan.update({
    where: { id: input.planId },
    data: {
      planStructure: planStructure as unknown as Prisma.InputJsonValue,
      totalTasks: planStructure.tasks.length,
      stage: "ENRICHING_TASKS",
    },
  });

  return {
    stage: "ENRICHING_TASKS" as const,
    refinedGoal: input.refinedGoal,
    planStructure,
  };
}
