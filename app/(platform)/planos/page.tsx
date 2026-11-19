import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import {
  formatWeekdayAndDatePt,
  getPlanDisplayTitle,
  getTaskStatus,
  parsePlanStructure,
} from "@/lib/plan-structure";
import { BeeLoader } from "@/app/components/bee-loader";
import { PlanosList, type PlanListItem } from "./planos-list";

const STAGE_LABELS: Record<string, string> = {
  REFINING_GOAL: "Refinando objetivo",
  INTERVIEWING_STEPS: "Em entrevista",
  GENERATING_TASKS: "Gerando plano",
  ENRICHING_TASKS: "Preparando conteúdos",
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
};

async function PlanosContent() {
  const user = await requireSessionUser();

  const plans = await prisma.learningPlan.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      stage: true,
      rawInput: true,
      refinedGoal: true,
      totalTasks: true,
      completedTasks: true,
      planStructure: true,
    },
  });

  const items: PlanListItem[] = plans.map((plan) => {
    const structure = parsePlanStructure(plan.planStructure);
    const tasks = structure?.tasks ?? [];
    const totalTasks = tasks.length || plan.totalTasks;
    const completedTasks =
      tasks.length > 0
        ? tasks.filter((t) => getTaskStatus(t) === "completed").length
        : plan.completedTasks;

    const nextPending = tasks.find((t) => getTaskStatus(t) !== "completed");
    const nextDateLabel = nextPending?.schedule?.date
      ? `${formatWeekdayAndDatePt(nextPending.schedule.date)} às ${nextPending.schedule.startTime}`
      : null;

    return {
      id: plan.id,
      title: getPlanDisplayTitle(plan, structure),
      stage: plan.stage,
      stageLabel: STAGE_LABELS[plan.stage] ?? plan.stage,
      totalTasks,
      completedTasks,
      nextDateLabel,
    };
  });

  return <PlanosList items={items} />;
}

export default function PlanosPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex items-center justify-center">
          <BeeLoader label="Carregando seus planos" />
        </div>
      }
    >
      <PlanosContent />
    </Suspense>
  );
}
