import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AnimatedLogo } from "@/app/components/animated-logo";
import { BeeLoader } from "@/app/components/bee-loader";
import { decrypt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const plan = await prisma.learningPlan.findFirst({
    where: {
      id: planId,
      userId,
    },
    select: {
      id: true,
      stage: true,
      rawInput: true,
      refinedGoal: true,
    },
  });

  if (!plan) {
    redirect("/primeiro-plano");
  }

  return <CriacaoPlanoClient plan={plan} />;
}

export default function CriacaoPlanoPage({ params }: CriacaoPlanoPageProps) {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#FFFDF8] font-sans text-[#2D3142] px-6 py-6 sm:px-10">
      <Suspense
        fallback={
          <>
            <header className="w-full max-w-[1040px] mx-auto flex items-center justify-between">
              <AnimatedLogo className="h-11 w-auto" />
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
