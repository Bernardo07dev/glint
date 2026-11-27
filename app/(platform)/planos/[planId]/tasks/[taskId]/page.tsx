import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { BeeLoader } from "@/app/components/bee-loader";
import { prisma } from "@/lib/infra/prisma";
import { requireSessionUser } from "@/lib/auth/session";
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

  const plan = await prisma.learningPlan.findFirst({
    where: { id: planId, userId: user.id },
    select: {
      id: true,
      complete: true,
      refinedGoal: true,
      rawInput: true,
    },
  });

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
  });

  if (!planTask) {
    notFound();
  }

  const parsedContent = parseTaskContent(planTask.content);

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
