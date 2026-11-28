import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/infra/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import {
  getPlanDisplayTitle,
  getTodayIsoInTimezone,
  groupTasksByWeek,
  parsePlanStructure,
} from "@/lib/plan/plan-structure";
import { BeeLoader } from "@/app/components/bee-loader";
import { PlanTrail } from "./plan-trail";

async function PlanDetailContent({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const user = await requireSessionUser();

  const plan = await prisma.learningPlan.findUnique({
    where: { id: planId },
  });

  if (!plan || plan.userId !== user.id) {
    notFound();
  }

  if (!plan.complete) {
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
      planId={plan.id}
      title={title}
      successCriteria={successCriteria}
      routineContract={routineContract}
      weeks={weeks}
      todayIso={todayIso}
    />
  );
}

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex items-center justify-center">
          <BeeLoader label="Abrindo trilha do plano" />
        </div>
      }
    >
      <PlanDetailContent params={params} />
    </Suspense>
  );
}
