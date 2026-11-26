import { generateText, Output } from "ai";
import { BASE_SYSTEM_PROMPT } from "@/lib/agents/prompts";
import { models } from "@/lib/infra/llm";
import {
  formatLearnerProfileSummary,
  formatPreviousFeedbackSummary,
  StepsPlanSchema,
  type StepAgentTaskContext,
  type StepBlueprintItem,
  type StepsPlan,
  type ToolId,
} from "./types";

const PEDAGOGICAL_TOOL_ORDER: readonly ToolId[] = [
  "video",
  "concept_explainer",
  "active_recall_quiz",
];

function normalizeRequiredTools(rawTools: string[]): ToolId[] {
  const allowed = new Set<ToolId>();
  for (const tool of rawTools) {
    if (
      tool === "video" ||
      tool === "concept_explainer" ||
      tool === "active_recall_quiz"
    ) {
      allowed.add(tool);
    }
  }

  const ordered = PEDAGOGICAL_TOOL_ORDER.filter((tool) => allowed.has(tool));
  return ordered.length > 0 ? ordered : ["concept_explainer", "active_recall_quiz"];
}

function allocateDefaultMinutes(
  tools: ToolId[],
  context: StepAgentTaskContext,
): number[] {
  const total = Math.max(5, context.durationMinutes || context.consumeMinutes + context.practiceMinutes || 25);
  const hasVideo = tools.includes("video");
  const hasExplainer = tools.includes("concept_explainer");
  const hasQuiz = tools.includes("active_recall_quiz");

  const quizMinutes = hasQuiz ? Math.min(8, Math.max(4, Math.round(total * 0.2))) : 0;
  const remaining = Math.max(4, total - quizMinutes);

  return tools.map((tool) => {
    if (tool === "active_recall_quiz") return quizMinutes;
    if (tool === "video") {
      if (hasExplainer) {
        return Math.max(4, Math.min(remaining - 4, context.consumeMinutes || Math.round(remaining * 0.55)));
      }
      return remaining;
    }
    if (hasVideo) {
      const videoPart = Math.max(4, Math.min(remaining - 4, context.consumeMinutes || Math.round(remaining * 0.55)));
      return Math.max(4, remaining - videoPart);
    }
    return remaining;
  });
}

/**
 * Stage 0 JIT planner: creates the `PlanTask.stepsPlan` blueprint mapping each
 * unique required tool to a focused learning step before executing tool agents.
 */
export async function runBlueprintAgent(
  context: StepAgentTaskContext,
): Promise<StepsPlan> {
  const orderedTools = normalizeRequiredTools(context.requiredTools);
  const defaultMinutes = allocateDefaultMinutes(orderedTools, context);
  const totalMinutes = Math.max(
    5,
    context.durationMinutes || context.consumeMinutes + context.practiceMinutes || 25,
  );

  const hasVideo = orderedTools.includes("video");
  const expectedLayout = orderedTools
    .map((tool, index) => {
      const phase =
        tool === "video"
          ? "consume"
          : tool === "active_recall_quiz"
            ? "practice"
            : hasVideo
              ? "practice"
              : "consume";
      return `${index + 1}. stepId="step_${String(index + 1).padStart(2, "0")}", tool="${tool}", phase="${phase}", sugestão ~${defaultMinutes[index]} min`;
    })
    .join("\n");

  const learnerProfile = formatLearnerProfileSummary(context.executableMeta);
  const previousFeedback = formatPreviousFeedbackSummary(context.previousFeedback);

  const { output } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: StepsPlanSchema,
      name: "TaskStepsBlueprint",
      description:
        "Plano base dos steps desta sessão (1 step por tool obrigatória) com objetivo específico e adaptação.",
    }),
    system: `${BASE_SYSTEM_PROMPT}

Você está planejando o blueprint interno (stepsPlan) de UMA sessão de estudo específica que será executada agora.

Regras obrigatórias:
1. Gere EXATAMENTE ${orderedTools.length} step(s), nesta ordem e com estas tools exatas:
${expectedLayout}
2. Nunca repita nem omita uma tool da lista acima.
3. A soma de "estimatedMinutes" dos steps deve fechar aproximadamente ${totalMinutes} minutos (respeitando consumeMinutes=${context.consumeMinutes} e practiceMinutes=${context.practiceMinutes}).
4. Cada "goal" deve ser específico para o tema da sessão (servirá de entrada direta para buscar vídeo real, pesquisar documentação via Firecrawl e gerar o quiz).
5. Preencha "adaptationNote" com uma nota curta caso haja feedback anterior relevante (ex.: "too_hard" ou "userNotes"); caso contrário, retorne null.`,
    prompt: `Objetivo macro do plano: "${context.refinedGoal}"
Sessão #${context.order}: "${context.title}"
Tipo da sessão: ${context.taskType}
Por que importa: ${context.whyItMatters}
Query base sugerida: "${context.searchQueryUsed}"

Perfil do aluno:
${learnerProfile}

Feedback da sessão anterior:
${previousFeedback}`,
  });

  // Enforce deterministic invariants so downstream tool agents never break on LLM drift.
  const normalizedSteps: StepBlueprintItem[] = orderedTools.map((tool, index) => {
    const matched =
      output.steps.find((s) => s.tool === tool) ?? output.steps[index];
    const phase: "consume" | "practice" =
      tool === "video"
        ? "consume"
        : tool === "active_recall_quiz"
          ? "practice"
          : hasVideo
            ? "practice"
            : "consume";

    const rawMinutes = matched?.estimatedMinutes ?? defaultMinutes[index];
    const estimatedMinutes = Math.max(2, Math.round(rawMinutes));

    return {
      stepId: `step_${String(index + 1).padStart(2, "0")}`,
      order: index + 1,
      phase,
      estimatedMinutes,
      tool,
      goal: matched?.goal?.trim() || `${context.title} — etapa de ${tool}`,
    };
  });

  return {
    adaptationNote: output.adaptationNote?.trim() || null,
    steps: normalizedSteps,
  };
}
