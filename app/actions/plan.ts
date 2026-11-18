"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CreatePlanState = {
  success?: boolean;
  error?: string;
};

export async function createPlanAction(
  _prevState: CreatePlanState,
  formData: FormData,
): Promise<CreatePlanState> {
  const goal = (formData.get("goal") as string | null)?.trim() ?? "";

  if (goal.length < 3) {
    return {
      success: false,
      error: "Conte um pouco mais sobre o que você quer aprender",
    };
  }

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

  let planId: string;
  try {
    const existingPlansCount = await prisma.learningPlan.count({
      where: { userId },
    });

    const plan = await prisma.learningPlan.create({
      data: {
        userId,
        isFirstPlan: existingPlansCount === 0,
        stage: "REFINING_GOAL",
        rawInput: goal,
        executableMeta: {},
        planStructure: {},
      },
      select: { id: true },
    });

    planId = plan.id;
  } catch (error) {
    console.error("Erro ao criar plano:", error);
    return {
      success: false,
      error: "Não foi possível iniciar seu plano agora",
    };
  }

  redirect(`/criacao-plano/${planId}`);
}
