import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight } from "@gravity-ui/icons";
import { AnimatedLogo } from "@/app/components/animated-logo";
import { BeeLoader } from "@/app/components/bee-loader";
import {
  getFallbackAnimationHeadline,
  getUserAnimationPhrases,
} from "@/lib/animations/phrases";
import { decrypt } from "@/lib/auth/auth";
import { prisma } from "@/lib/infra/prisma";
import { CriacaoPlanoClient } from "./criacao-plano-client";

interface CriacaoPlanoPageProps {
  params: Promise<{ "plan-id": string }>;
}

async function CriacaoPlanoSession({ params }: CriacaoPlanoPageProps) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("glint-session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  let userId: string | null = null;
  try {
    const session = await decrypt(sessionCookie);
    if (typeof session?.userId === "string" && session.userId) {
      userId = session.userId;
    }
  } catch {
    userId = null;
  }

  if (!userId) {
    redirect("/login");
  }

  const { "plan-id": planId } = await params;

  const [plan, user, phrases] = await Promise.all([
    prisma.learningPlan.findFirst({
      where: {
        id: planId,
        userId,
      },
      select: {
        id: true,
        complete: true,
        stage: true,
        rawInput: true,
        refinedGoal: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    getUserAnimationPhrases(userId),
  ]);

  if (!plan) {
    redirect("/primeiro-plano");
  }

  if (plan.complete) {
    redirect(`/planos/${plan.id}`);
  }

  const loaderHeadlines = {
    planCreation:
      phrases.planCreation?.trim() ||
      getFallbackAnimationHeadline("planCreation", user?.name),
    waitingFrontTap:
      phrases.waitingFrontTap?.trim() ||
      getFallbackAnimationHeadline("waitingFrontTap", user?.name),
  };

  return <CriacaoPlanoClient plan={plan} loaderHeadlines={loaderHeadlines} />;
}

export default function CriacaoPlanoPage({ params }: CriacaoPlanoPageProps) {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#FFFDF8] font-sans text-[#2D3142] px-6 py-6 sm:px-10">
      <Suspense
        fallback={
          <>
            <header className="w-full max-w-[1040px] mx-auto flex items-center justify-between gap-3">
              <AnimatedLogo className="h-11 w-auto" />
              <Link
                href="/home"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-sans text-xs font-medium text-[#646B82] hover:text-[#2D3142] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
              >
                <span>Pular por enquanto</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </header>
            <div className="my-auto py-12 flex items-center justify-center">
              <BeeLoader label="Carregando seu plano" />
            </div>
          </>
        }
      >
        <CriacaoPlanoSession params={params} />
      </Suspense>

      <div aria-hidden="true" className="h-4" />
    </main>
  );
}
