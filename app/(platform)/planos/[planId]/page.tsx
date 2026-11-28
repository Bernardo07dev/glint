import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/infra/prisma";
import { getUserAnimationPhrase } from "@/lib/animations/phrases";
import { requireSessionUser } from "@/lib/auth/session";
import {
  getPlanDisplayTitle,
  getTodayIsoInTimezone,
  groupTasksByWeek,
  parsePlanStructure,
} from "@/lib/plan/plan-structure";
import { BeeLoader } from "@/app/components/bee-loader";
import { PlansHubSplash } from "./plans-hub-splash";
import { PlanTrail } from "./plan-trail";

async function PlanDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ replanned?: string }>;
}) {
  const [{ planId }, { replanned }] = await Promise.all([params, searchParams]);
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

  const showReplannedSplash = replanned === "1";
  const plansHubHeadline = showReplannedSplash
    ? await getUserAnimationPhrase(user.id, "plansHub", user.name)
    : "";

  return (
    <PlansHubSplash showSplash={showReplannedSplash} headline={plansHubHeadline}>
      <PlanTrail
        planId={plan.id}
        title={title}
        successCriteria={successCriteria}
        routineContract={routineContract}
        weeks={weeks}
        todayIso={todayIso}
      />
    </PlansHubSplash>
  );
}

export default function PlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ replanned?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex items-center justify-center">
          <BeeLoader label="Abrindo trilha do plano" />
        </div>
      }
    >
      <PlanDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
