import type { Prisma } from "@prisma/client";
import { runMetaPlanAgent } from "@/lib/agents/meta-plan";
import type { ExecutableMeta } from "@/lib/agents/types";
import { prisma } from "@/lib/infra/prisma";

export function hasExecutableSteps(meta: unknown): meta is ExecutableMeta {
  return (
    typeof meta === "object" &&
    meta !== null &&
    Array.isArray((meta as ExecutableMeta).steps) &&
    (meta as ExecutableMeta).steps.length > 0
  );
}

export async function handleMetaPlanStage(input: {
  planId: string;
  rawInput: string;
  refinedGoal: string;
  knowledgeGraph?: string | null;
}): Promise<ExecutableMeta> {
  const executableMeta = await runMetaPlanAgent({
    rawInput: input.rawInput,
    refinedGoal: input.refinedGoal,
    knowledgeGraph: input.knowledgeGraph,
  });

  await prisma.learningPlan.update({
    where: { id: input.planId },
    data: {
      executableMeta: executableMeta as unknown as Prisma.InputJsonValue,
      currentStepId: executableMeta.steps[0]?.id ?? null,
    },
  });

  return executableMeta;
}
