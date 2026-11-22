import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import {
  buildWeekStrip,
  getTodayIsoInTimezone,
  selectNextTask,
} from "@/lib/plan-structure";
import { BeeLoader } from "@/app/components/bee-loader";
import { HomeClient } from "./home-client";

const IN_CREATION_STAGES = new Set([
  "REFINING_GOAL",
  "INTERVIEWING_STEPS",
  "GENERATING_TASKS",
  "ENRICHING_TASKS",
]);

async function HomeContent() {
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

  const inCreation = plans.find((p) => IN_CREATION_STAGES.has(p.stage)) ?? null;
  const activePlans = plans.filter((p) => p.stage === "ACTIVE");

  const todayIso = getTodayIsoInTimezone(user.timezone);
  const { nextTask, completedToday } = selectNextTask(activePlans, todayIso);
  const { weeks, rhythm } = buildWeekStrip(activePlans, todayIso);

  return (
    <HomeClient
      inCreationPlan={
        inCreation ? { id: inCreation.id, rawInput: inCreation.rawInput } : null
      }
      nextTask={nextTask}
      completedToday={completedToday}
      weeks={weeks}
      rhythm={rhythm}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex items-center justify-center">
          <BeeLoader label="Preparando sua agenda" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
