import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight } from "@gravity-ui/icons";
import { AnimatedLogo } from "../components/animated-logo";
import { decrypt } from "@/lib/auth/auth";
import { prisma } from "@/lib/infra/prisma";
import { getUserAnimationPhrase } from "@/lib/animations/phrases";
import { BeeLoader } from "../components/bee-loader";
import { FirstAccessGate } from "./first-access-gate";
import { PrimeiroPlanoForm } from "./primeiro-plano-form";

async function PrimeiroPlanoSession() {
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, onboardingCompleted: true },
  });

  if (!user) {
    redirect("/login");
  }

  const showSplash = !user.onboardingCompleted;
  const [headline, planCreationHeadline] = await Promise.all([
    showSplash
      ? getUserAnimationPhrase(user.id, "firstAccess", user.name)
      : Promise.resolve(""),
    getUserAnimationPhrase(user.id, "planCreation", user.name),
  ]);

  return (
    <FirstAccessGate showSplash={showSplash} headline={headline}>
      <PrimeiroPlanoForm
        userName={user.name}
        planCreationHeadline={planCreationHeadline}
      />
    </FirstAccessGate>
  );
}

export default function PrimeiroPlanoPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#FFFDF8] font-sans text-[#2D3142] px-6 py-6 sm:px-10">
      <header className="w-full max-w-[1040px] mx-auto flex items-center justify-between">
        <AnimatedLogo className="h-11 w-auto" />

        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-sans text-xs font-medium text-[#646B82] hover:text-[#2D3142] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
        >
          <span>Pular por enquanto</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </header>

      <Suspense
        fallback={
          <div className="my-auto py-8 flex items-center justify-center">
            <BeeLoader label="Preparando sua jornada" />
          </div>
        }
      >
        <PrimeiroPlanoSession />
      </Suspense>

      <div aria-hidden="true" className="h-4" />
    </main>
  );
}
