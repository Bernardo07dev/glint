"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/auth/auth";
import { rebuildLearnerContext } from "@/lib/plan/learner-context";
import { prisma } from "@/lib/infra/prisma";
import { getSessionUser } from "@/lib/auth/session";

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

export async function deletePlanAction(
  planId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Sessão expirada" };
  }

  if (!planId?.trim()) {
    return { success: false, error: "Plano inválido" };
  }

  try {
    const deleted = await prisma.learningPlan.deleteMany({
      where: { id: planId, userId: user.id },
    });

    if (deleted.count === 0) {
      return { success: false, error: "Plano não encontrado" };
    }

    try {
      await rebuildLearnerContext(user.id);
    } catch (contextError) {
      console.error("Erro ao atualizar knowledgeGraph após exclusão:", contextError);
    }

    revalidatePath("/planos");
    revalidatePath("/home");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir plano:", error);
    return {
      success: false,
      error: "Não foi possível excluir o plano agora.",
    };
  }
}
