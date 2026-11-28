import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/auth/auth";
import { prisma } from "@/lib/infra/prisma";
import { parsePlanCreationPrompts } from "@/lib/plan/learner-context";
import {
  getFallbackAnimationHeadline,
  getUserAnimationPhrase,
} from "@/lib/animations/phrases";
import { BeeLoader } from "@/app/components/bee-loader";
import { NovoPlanoForm } from "./novo-plano-form";

async function NovoPlanoSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("glint-session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  let userName: string | null = null;
  let userId: string | null = null;

  try {
    const session = await decrypt(sessionCookie);
    userName = session.name ?? null;
    userId = session.userId ?? null;
  } catch {
    redirect("/login");
  }

  const [existingPlans, userRecord, planCreationHeadline] = userId
    ? await Promise.all([
        prisma.learningPlan.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            rawInput: true,
            refinedGoal: true,
            stage: true,
            completedTasks: true,
            totalTasks: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { planCreationPrompts: true },
        }),
        getUserAnimationPhrase(userId, "planCreation", userName),
      ])
    : [[], null, getFallbackAnimationHeadline("planCreation", userName)];

  const personalization = parsePlanCreationPrompts(
    userRecord?.planCreationPrompts,
  );

  return (
    <NovoPlanoForm
      userName={userName}
      existingPlans={existingPlans}
      personalization={personalization}
      planCreationHeadline={planCreationHeadline}
    />
  );
}

export default function NovoPlanoPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-center px-4 py-6 sm:px-8">
      <Suspense
        fallback={
          <div className="my-auto py-8 flex items-center justify-center">
            <BeeLoader label="Preparando sua jornada" />
          </div>
        }
      >
        <NovoPlanoSession />
      </Suspense>
    </div>
  );
}
