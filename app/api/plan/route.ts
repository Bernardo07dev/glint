import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { PlanApiRequestSchema } from "@/lib/agents/types";
import { decrypt } from "@/lib/auth";
import { updateLearnerContext } from "@/lib/learner-context";
import { getOccupiedSlots } from "@/lib/occupied-slots";
import { prisma } from "@/lib/prisma";
import { handleAcceptPlanStage } from "./handlers/accept-plan";
import {
  handleGeneratingTasksStage,
  hasPlanStructure,
} from "./handlers/generating-tasks";
import { handleInterviewingStepsStage } from "./handlers/interviewing-steps";
import { handleMetaPlanStage, hasExecutableSteps } from "./handlers/meta-plan";
import { handleRefiningGoalStage } from "./handlers/refining-goal";

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("glint-session")?.value;

  if (!sessionCookie) return null;

  try {
    const session = await decrypt(sessionCookie);
    return typeof session?.userId === "string" && session.userId
      ? session.userId
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const parsed = PlanApiRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados da requisição inválidos" },
      { status: 400 },
    );
  }

  const { planId, answer, action, feedback } = parsed.data;

  const plan = await prisma.learningPlan.findFirst({
    where: { id: planId, userId },
    include: {
      user: {
        select: { timezone: true, knowledgeGraph: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!plan) {
    return NextResponse.json(
      { error: "Plano não encontrado" },
      { status: 404 },
    );
  }

  try {
    if (action === "accept_plan") {
      const result = await handleAcceptPlanStage({
        planId: plan.id,
        planStructure: plan.planStructure,
        userId,
        userTimezone: plan.user.timezone,
      });

      if (!result.ok) {
        return NextResponse.json(
          {
            error: result.error,
            ...("conflicts" in result
              ? { conflicts: result.conflicts }
              : {}),
          },
          { status: result.status },
        );
      }

      return NextResponse.json({
        stage: result.stage,
        redirectTo: result.redirectTo,
      });
    }

    if (action === "adjust_plan" && feedback) {
      if (!hasExecutableSteps(plan.executableMeta)) {
        return NextResponse.json(
          { error: "Meta-plano incompleto para ajustar tarefas" },
          { status: 400 },
        );
      }

      const priorFeedbacks = plan.messages
        .filter(
          (message) =>
            message.stage === "GENERATING_TASKS" && message.role === "USER",
        )
        .map((message) => message.content);

      const generatingPayload = await handleGeneratingTasksStage({
        planId: plan.id,
        rawInput: plan.rawInput,
        refinedGoal: plan.refinedGoal ?? plan.rawInput,
        executableMeta: plan.executableMeta,
        feedback,
        priorFeedbacks,
        previousPlanStructure: hasPlanStructure(plan.planStructure)
          ? plan.planStructure
          : null,
        occupiedSlots: await getOccupiedSlots(userId, plan.id),
      });

      try {
        await updateLearnerContext(plan.id);
      } catch (error) {
        console.error("Falha ao atualizar o knowledge graph do aluno:", error);
      }

      return NextResponse.json(generatingPayload);
    }

    if (plan.stage === "REFINING_GOAL") {
      const payload = await handleRefiningGoalStage(
        plan,
        answer,
        plan.user.knowledgeGraph,
      );

      if (payload.stage !== "INTERVIEWING_STEPS" || !payload.refinedGoal) {
        return NextResponse.json(payload);
      }

      const executableMeta = await handleMetaPlanStage({
        planId: plan.id,
        rawInput: plan.rawInput,
        refinedGoal: payload.refinedGoal,
        knowledgeGraph: plan.user.knowledgeGraph,
      });

      const updatedPlan = {
        ...plan,
        stage: "INTERVIEWING_STEPS" as const,
        refinedGoal: payload.refinedGoal,
        currentStepId: executableMeta.steps[0]?.id ?? null,
      };

      const interviewPayload = await handleInterviewingStepsStage(
        updatedPlan,
        executableMeta,
        undefined,
        await getOccupiedSlots(userId, plan.id),
      );

      return NextResponse.json(interviewPayload);
    }

    if (plan.stage === "INTERVIEWING_STEPS") {
      const executableMeta =
        !hasExecutableSteps(plan.executableMeta) && plan.refinedGoal
          ? await handleMetaPlanStage({
              planId: plan.id,
              rawInput: plan.rawInput,
              refinedGoal: plan.refinedGoal,
              knowledgeGraph: plan.user.knowledgeGraph,
            })
          : hasExecutableSteps(plan.executableMeta)
            ? plan.executableMeta
            : null;

      if (!executableMeta) {
        return NextResponse.json(
          { error: "Meta-plano não encontrado" },
          { status: 400 },
        );
      }

      const interviewPayload = await handleInterviewingStepsStage(
        plan,
        executableMeta,
        answer,
        await getOccupiedSlots(userId, plan.id),
      );

      return NextResponse.json(interviewPayload);
    }

    if (plan.stage === "GENERATING_TASKS") {
      if (hasPlanStructure(plan.planStructure)) {
        return NextResponse.json({
          stage: plan.stage,
          refinedGoal: plan.refinedGoal,
          planStructure: plan.planStructure,
        });
      }

      if (!hasExecutableSteps(plan.executableMeta)) {
        return NextResponse.json(
          { error: "Meta-plano incompleto para gerar tarefas" },
          { status: 400 },
        );
      }

      const generatingPayload = await handleGeneratingTasksStage({
        planId: plan.id,
        rawInput: plan.rawInput,
        refinedGoal: plan.refinedGoal ?? plan.rawInput,
        executableMeta: plan.executableMeta,
        occupiedSlots: await getOccupiedSlots(userId, plan.id),
      });

      try {
        await updateLearnerContext(plan.id);
      } catch (error) {
        console.error("Falha ao atualizar o knowledge graph do aluno:", error);
      }

      return NextResponse.json(generatingPayload);
    }

    return NextResponse.json({
      stage: plan.stage,
      refinedGoal: plan.refinedGoal,
      planStructure: hasPlanStructure(plan.planStructure)
        ? plan.planStructure
        : null,
    });
  } catch (error) {
    console.error("Erro em POST /api/plan:", error);
    return NextResponse.json(
      { error: "Não foi possível processar o plano agora" },
      { status: 500 },
    );
  }
}
