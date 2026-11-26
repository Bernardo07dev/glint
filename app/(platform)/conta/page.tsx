import { Suspense } from "react";
import { prisma } from "@/lib/infra/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import {
  getPlanDisplayTitle,
  parsePlanStructure,
  type RoutineSlot,
} from "@/lib/plan/plan-structure";
import { BeeLoader } from "@/app/components/bee-loader";
import { ContaClient, type PlanRoutineSummary } from "./conta-client";

async function ContaContent() {
  const user = await requireSessionUser();

  const activePlans = await prisma.learningPlan.findMany({
    where: { userId: user.id, stage: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      rawInput: true,
      refinedGoal: true,
      planStructure: true,
    },
  });

  const routines: PlanRoutineSummary[] = activePlans
    .map((p) => {
      const structure = parsePlanStructure(p.planStructure);
      const slots: RoutineSlot[] = structure?.routineContract?.slots ?? [];
      if (slots.length === 0) return null;
      return {
        planId: p.id,
        planTitle: getPlanDisplayTitle(p, structure),
        weeklyHours: structure?.routineContract?.weeklyHours ?? 0,
        slots,
      };
    })
    .filter((r): r is PlanRoutineSummary => r !== null);

  return (
    <ContaClient
      user={{
        name: user.name,
        email: user.email,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt ? user.planExpiresAt.toISOString() : null,
        timezone: user.timezone,
      }}
      routines={routines}
    />
  );
}

export default function ContaPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex items-center justify-center">
          <BeeLoader label="Carregando sua conta" />
        </div>
      }
    >
      <ContaContent />
    </Suspense>
  );
}
