import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import {
  getPlanDisplayTitle,
  getTodayIsoInTimezone,
  groupTasksByWeek,
  parsePlanStructure,
} from "@/lib/plan-structure";
import { BeeLoader } from "@/app/components/bee-loader";
import { PlanTrail } from "./plan-trail";

async function PlanDetailContent({ planId }: { planId: string }) {
  const user = await requireSessionUser();

  const plan = await prisma.learningPlan.findUnique({
    where: { id: planId },
  });

  if (!plan || plan.userId !== user.id) {
    notFound();
  }

  if (
    plan.stage === "REFINING_GOAL" ||
    plan.stage === "INTERVIEWING_STEPS" ||
    plan.stage === "GENERATING_TASKS" ||
    plan.stage === "ENRICHING_TASKS"
  ) {
    redirect(`/criacao-plano/${plan.id}`);
  }

  const structure = parsePlanStructure(plan.planStructure);
  const title = getPlanDisplayTitle(plan, structure);
  const successCriteria = structure?.objective?.successCriteria ?? [];
  const routineContract = structure?.routineContract ?? null;
  const weeks = groupTasksByWeek(structure?.tasks ?? []);
  const todayIso = getTodayIsoInTimezone(
    routineContract?.timezone || user.timezone,
  );

  return (
    <PlanTrail
      title={title}
      successCriteria={successCriteria}
      routineContract={routineContract}
      weeks={weeks}
      todayIso={todayIso}
    />
  );
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;

  return (
    <Suspense
      fallback={
        <div className="py-20 flex items-center justify-center">
          <BeeLoader label="Abrindo trilha do plano" />
        </div>
      }
    >
      <PlanDetailContent planId={planId} />
    </Suspense>
  );
}
