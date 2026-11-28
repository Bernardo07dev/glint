import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { BeeLoader } from "@/app/components/bee-loader";
import { getUserAnimationPhrase } from "@/lib/animations/phrases";
import { prisma } from "@/lib/infra/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import {
  ensureTaskStepProgress,
  serializeStepProgress,
} from "@/lib/tasks/step-progress";
import { parseTaskContent } from "@/lib/tasks/task-content";
import { TaskSessionClient } from "./task-session-client";

async function TaskSessionContent({
  params,
}: {
  params: Promise<{ planId: string; taskId: string }>;
}) {
  const [{ planId, taskId }, user] = await Promise.all([
    params,
    requireSessionUser(),
  ]);

  const [plan, waitingHeadline] = await Promise.all([
    prisma.learningPlan.findFirst({
      where: { id: planId, userId: user.id },
      select: {
        id: true,
        complete: true,
        refinedGoal: true,
        rawInput: true,
      },
    }),
    getUserAnimationPhrase(user.id, "waitingFrontTap", user.name),
  ]);

  if (!plan) {
    notFound();
  }

  if (!plan.complete) {
    redirect(`/criacao-plano/${plan.id}`);
  }

  const planTask = await prisma.planTask.findFirst({
    where: {
      planId: plan.id,
      OR: [{ id: taskId }, { taskKey: taskId }],
    },
    include: {
      stepProgress: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!planTask) {
    notFound();
  }

  const parsedContent = parseTaskContent(planTask.content);

  let initialStepProgress = serializeStepProgress(planTask.stepProgress);
  let initialCurrentStepId = planTask.currentStepId;

  if (parsedContent) {
    const ensured = await ensureTaskStepProgress({
      taskId: planTask.id,
      content: parsedContent,
      completedSteps: planTask.completedSteps,
      currentStepId: planTask.currentStepId,
      existingRows: planTask.stepProgress,
    });
    initialStepProgress = serializeStepProgress(ensured.rows);
    initialCurrentStepId = ensured.currentStepId;
  }

  return (
    <TaskSessionClient
      planId={plan.id}
      planTitle={plan.refinedGoal ?? plan.rawInput}
      taskKey={planTask.taskKey}
      title={planTask.title}
      whyItMatters={planTask.whyItMatters}
      durationMinutes={planTask.durationMinutes}
      initialEnrichmentStatus={planTask.enrichmentStatus}
      initialTaskStatus={planTask.status}
      initialContent={parsedContent}
      initialCompletedSteps={planTask.completedSteps}
      initialStepProgress={initialStepProgress}
      initialCurrentStepId={initialCurrentStepId}
      waitingHeadline={waitingHeadline}
    />
  );
}

export default function TaskSessionPage({
  params,
}: {
  params: Promise<{ planId: string; taskId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70dvh] flex items-center justify-center">
          <BeeLoader label="Abrindo sua sessão" />
        </div>
      }
    >
      <TaskSessionContent params={params} />
    </Suspense>
  );
}
