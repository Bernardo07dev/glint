import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { BeeLoader } from "@/app/components/bee-loader";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/infra/prisma";
import { ReplanClient } from "./replan-client";

async function ReplanContent({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const [{ planId }, user] = await Promise.all([
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

  return (
    <ReplanClient
      planId={plan.id}
      planTitle={plan.refinedGoal ?? plan.rawInput}
    />
  );
}

export default function PlanReplanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70dvh] flex items-center justify-center">
          <BeeLoader label="Abrindo ajustes do plano" />
        </div>
      }
    >
      <ReplanContent params={params} />
    </Suspense>
  );
}
