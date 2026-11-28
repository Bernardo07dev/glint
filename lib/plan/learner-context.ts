import { Prisma } from "@prisma/client";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { ExecutableMeta } from "@/lib/agents/types";
import { models } from "@/lib/infra/llm";
import { prisma } from "@/lib/infra/prisma";
import { parseStepQuizProgress } from "@/lib/tasks/step-progress";

const MAX_CONTEXT_CHARS = 2000;

export const PlanCreationPromptsSchema = z.object({
  greeting: z.string().min(10).max(160),
  suggestions: z.array(z.string().min(5).max(120)).min(3).max(4),
});

export type PlanCreationPrompts = z.infer<typeof PlanCreationPromptsSchema>;

const LearnerContextOutputSchema = z.object({
  summary: z.string().min(10),
  greeting: z.string().min(10).max(160),
  suggestions: z.array(z.string().min(5).max(120)).min(3).max(4),
});

export function parsePlanCreationPrompts(
  value: unknown,
): PlanCreationPrompts | null {
  const parsed = PlanCreationPromptsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function getLearnerContext(
  userId: string,
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { knowledgeGraph: true },
  });

  return user?.knowledgeGraph?.trim() ? user.knowledgeGraph : null;
}

export async function rebuildLearnerContext(userId: string): Promise<void> {
  const plans = await prisma.learningPlan.findMany({
    where: { userId, refinedGoal: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      rawInput: true,
      refinedGoal: true,
      stage: true,
      executableMeta: true,
      tasks: {
        where: {
          status: { in: ["COMPLETED", "IN_PROGRESS"] },
        },
        orderBy: { order: "asc" },
        select: {
          order: true,
          title: true,
          status: true,
          durationMinutes: true,
          difficultyRating: true,
          userNotes: true,
          stepProgress: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (plans.length === 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        knowledgeGraph: null,
        planCreationPrompts: Prisma.DbNull,
      },
    });
    return;
  }

  const planSections = plans.map((plan, index) => {
    const executableMeta = plan.executableMeta as ExecutableMeta | null;
    const answeredSteps = Array.isArray(executableMeta?.steps)
      ? executableMeta.steps
          .filter((step) => step.value)
          .map((step) => `- ${step.questionGoal}: ${step.value}`)
          .join("\n")
      : "";

    let totalEstimatedMin = 0;
    let totalActualSec = 0;
    let totalChecklistDone = 0;
    let totalChecklistMax = 0;
    let totalQuizCorrect = 0;
    let totalQuizQuestions = 0;
    const recentSessionLines: string[] = [];

    for (const task of plan.tasks) {
      let taskSec = 0;
      let taskChecked = 0;
      let taskTotalItems = 0;
      let taskQuizTag = "";

      for (const sp of task.stepProgress) {
        taskSec += sp.timeSpentSeconds;
        taskChecked += sp.checkedItems.length;
        taskTotalItems += sp.totalChecklistItems;

        if (sp.toolType === "active_recall_quiz" && sp.quizData) {
          const parsedQuiz = parseStepQuizProgress(sp.quizData);
          if (parsedQuiz?.firstAttemptScore) {
            totalQuizCorrect += parsedQuiz.firstAttemptScore.correct;
            totalQuizQuestions += parsedQuiz.firstAttemptScore.total;
            taskQuizTag = ` | quiz 1ª tent.: ${parsedQuiz.firstAttemptScore.correct}/${parsedQuiz.firstAttemptScore.total}`;
          }
        }
      }

      if (taskSec > 0) {
        totalEstimatedMin += task.durationMinutes;
        totalActualSec += taskSec;
      }
      totalChecklistDone += taskChecked;
      totalChecklistMax += taskTotalItems;

      const spentMin = (taskSec / 60).toFixed(1);
      recentSessionLines.push(
        `- Sessão #${task.order} "${task.title}" (${task.status}): tempo real ${spentMin}m/${task.durationMinutes}m est. | checklist ${taskChecked}/${taskTotalItems}${taskQuizTag}${
          task.difficultyRating ? ` | dificuldade: ${task.difficultyRating}` : ""
        }${task.userNotes ? ` | nota: "${task.userNotes}"` : ""}`,
      );
    }

    const telemetryLines: string[] = [];
    if (totalActualSec > 0 && totalEstimatedMin > 0) {
      const actualMin = Math.round(totalActualSec / 60);
      telemetryLines.push(
        `- Ritmo real acumulado: ${actualMin} min reais vs. ${totalEstimatedMin} min estimados`,
      );
    }
    if (totalChecklistMax > 0) {
      const pct = Math.round((totalChecklistDone / totalChecklistMax) * 100);
      telemetryLines.push(
        `- Aderência aos checklists práticos: ${totalChecklistDone}/${totalChecklistMax} (${pct}%)`,
      );
    }
    if (totalQuizQuestions > 0) {
      const pct = Math.round((totalQuizCorrect / totalQuizQuestions) * 100);
      telemetryLines.push(
        `- Taxa de acerto de 1ª tentativa nos quizzes: ${totalQuizCorrect}/${totalQuizQuestions} (${pct}%)`,
      );
    }
    if (recentSessionLines.length > 0) {
      telemetryLines.push(
        `Histórico recente de execução:\n${recentSessionLines.slice(-5).join("\n")}`,
      );
    }

    const lines = [
      `### Plano ${index + 1} (${plan.stage})`,
      `Pedido inicial: "${plan.rawInput}"`,
      `Objetivo refinado: "${plan.refinedGoal}"`,
    ];
    if (answeredSteps) {
      lines.push(`Respostas da entrevista:\n${answeredSteps}`);
    }
    if (telemetryLines.length > 0) {
      lines.push(`Telemetria real de estudo:\n${telemetryLines.join("\n")}`);
    }
    return lines.join("\n");
  });

  const { output } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: LearnerContextOutputSchema,
      name: "LearnerContext",
      description:
        "Resumo consolidado do perfil de aprendizado do aluno a partir de todos os seus planos atuais.",
    }),
    system: `Você mantém o knowledge graph do aluno do Glint e personaliza a tela de criação de novos planos.

Regras para summary:
- Escreva em português brasileiro, em até ${MAX_CONTEXT_CHARS} caracteres.
- Registre apenas fatos úteis para personalizar planos futuros: temas estudados, objetivos, nível declarado, rotina disponível, estilo de aprendizado e restrições relevantes.
- Consolide todos os planos listados, removendo redundâncias.
- Não inclua opiniões, previsões ou dados sensíveis.

Regras para greeting:
- Uma frase curta, acolhedora e direta (1 linha, até 140 caracteres) convidando o aluno a escolher o próximo objetivo, levando em conta o que ele já estuda/estudou (sem repetir o nome do aluno).

Regras para suggestions:
- 4 sugestões curtas e práticas de próximos objetivos de aprendizado complementares ou próximos aos interesses do aluno (sem repetir objetivos idênticos aos planos já existentes).`,
    prompt: planSections.join("\n\n"),
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      knowledgeGraph: output.summary.slice(0, MAX_CONTEXT_CHARS),
      planCreationPrompts: {
        greeting: output.greeting,
        suggestions: output.suggestions,
      },
    },
  });
}

export async function updateLearnerContext(planId: string): Promise<void> {
  const plan = await prisma.learningPlan.findUnique({
    where: { id: planId },
    select: { userId: true },
  });

  if (!plan) return;
  await rebuildLearnerContext(plan.userId);
}
