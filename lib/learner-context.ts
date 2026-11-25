import { generateText, Output } from "ai";
import { z } from "zod";
import type { ExecutableMeta } from "@/lib/agents/types";
import { models } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

const MAX_CONTEXT_CHARS = 2000;

const LearnerContextOutputSchema = z.object({
  summary: z.string().min(10),
});

export async function getLearnerContext(
  userId: string,
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { knowledgeGraph: true },
  });

  return user?.knowledgeGraph?.trim() ? user.knowledgeGraph : null;
}

export async function updateLearnerContext(planId: string): Promise<void> {
  const plan = await prisma.learningPlan.findUnique({
    where: { id: planId },
    include: {
      user: { select: { id: true, knowledgeGraph: true } },
    },
  });

  if (!plan || !plan.refinedGoal) return;

  const executableMeta = plan.executableMeta as ExecutableMeta | null;
  const answeredSteps = Array.isArray(executableMeta?.steps)
    ? executableMeta.steps
        .filter((step) => step.value)
        .map((step) => `- ${step.questionGoal}: ${step.value}`)
        .join("\n")
    : "";

  const sections = [
    `Pedido inicial: "${plan.rawInput}"`,
    `Objetivo refinado: "${plan.refinedGoal}"`,
  ];

  if (answeredSteps) {
    sections.push(`Respostas da entrevista:\n${answeredSteps}`);
  }

  if (plan.user.knowledgeGraph?.trim()) {
    sections.push(`Resumo anterior do aluno:\n${plan.user.knowledgeGraph.trim()}`);
  }

  const { output } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: LearnerContextOutputSchema,
      name: "LearnerContext",
      description:
        "Resumo acumulado do perfil de aprendizado do aluno, mesclando contexto anterior com o novo plano.",
    }),
    system: `Você mantém o knowledge graph do aluno do Glint: um resumo textual curto e factual do que já se sabe sobre a pessoa como aprendiz.

Regras:
- Escreva em português brasileiro, em até ${MAX_CONTEXT_CHARS} caracteres.
- Registre apenas fatos úteis para personalizar planos futuros: temas já estudados, objetivos anteriores, nível declarado, rotina disponível, estilo de aprendizado e restrições relevantes.
- Mescle o resumo anterior com as novas informações, removendo redundâncias e preservando fatos ainda válidos.
- Não inclua opiniões, previsões ou dados sensíveis.`,
    prompt: sections.join("\n\n"),
  });

  await prisma.user.update({
    where: { id: plan.user.id },
    data: { knowledgeGraph: output.summary.slice(0, MAX_CONTEXT_CHARS) },
  });
}
