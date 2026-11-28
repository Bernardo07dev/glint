import { Suspense } from "react";
import type { HomeSplashVariant } from "@/app/components/animations";
import { BeeLoader } from "@/app/components/bee-loader";
import {
  getUserAnimationPhrase,
  type AnimationColumn,
} from "@/lib/animations/phrases";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/infra/prisma";
import {
  buildWeekStrip,
  getTodayIsoInTimezone,
  selectNextTask,
} from "@/lib/plan/plan-structure";
import { HomeClient } from "./home-client";

const IN_CREATION_STAGES = new Set([
  "REFINING_GOAL",
  "INTERVIEWING_STEPS",
  "GENERATING_TASKS",
  "ENRICHING_TASKS",
]);

const VARIANT_TO_COLUMN: Record<HomeSplashVariant, AnimationColumn> = {
  READY: "homeSplashReady",
  STREAK: "homeSplashStreak",
  RETURN: "homeSplashReturn",
  REST: "homeSplashRest",
};

async function HomeContent() {
  const user = await requireSessionUser();

  const [plans, userMeta] = await Promise.all([
    prisma.learningPlan.findMany({
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
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { lastActiveAt: true },
    }),
  ]);

  const inCreation = plans.find((p) => IN_CREATION_STAGES.has(p.stage)) ?? null;
  const activePlans = plans.filter((p) => p.stage === "ACTIVE");

  const todayIso = getTodayIsoInTimezone(user.timezone);
  const { nextTask, completedToday } = selectNextTask(activePlans, todayIso);
  const { weeks, rhythm } = buildWeekStrip(activePlans, todayIso);

  const daysSinceLastActive = userMeta?.lastActiveAt
    ? (Date.now() - userMeta.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  let splashVariant: HomeSplashVariant = "READY";
  if (daysSinceLastActive > 3) {
    splashVariant = "RETURN";
  } else if (rhythm.completed >= 3) {
    splashVariant = "STREAK";
  } else if (completedToday && !nextTask) {
    splashVariant = "REST";
  }

  const splashHeadline = await getUserAnimationPhrase(
    user.id,
    VARIANT_TO_COLUMN[splashVariant],
    user.name,
  );

  return (
    <HomeClient
      inCreationPlan={
        inCreation ? { id: inCreation.id, rawInput: inCreation.rawInput } : null
      }
      nextTask={nextTask}
      completedToday={completedToday}
      weeks={weeks}
      rhythm={rhythm}
      splash={{
        variant: splashVariant,
        headline: splashHeadline,
        dateKey: todayIso,
      }}
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
