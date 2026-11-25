import { generateText, Output } from "ai";
import { z } from "zod";
import { BASE_SYSTEM_PROMPT } from "@/lib/agents/prompts";
import { checkWithJev, models } from "@/lib/llm";
import {
  RecallQuizSchema,
  SessionStepSchema,
  TaskContentSchema,
  type ConceptExplainerData,
  type RecallQuizData,
  type SessionStepData,
  type TaskContent,
  type VideoToolData,
} from "@/lib/task-content";
import {
  formatPreviousFeedbackSummary,
  type StepAgentTaskContext,
  type StepsPlan,
} from "./types";

const RecallQuizLlmSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        question: z.string().min(1),
        options: z
          .array(
            z.object({
              id: z.string().min(1),
              text: z.string().min(1),
              explanation: z.string().min(1),
            }),
          )
          .min(3)
          .max(4),
        correctOptionId: z.string().min(1),
        explanation: z.string().min(1),
      }),
    )
    .min(2)
    .max(5),
});

const WalkthroughSynthesisLlmSchema = z.object({
  steps: z
    .array(
      z.object({
        stepId: z.string().min(1),
        title: z.string().min(1),
        objective: z.string().min(1),
        walkthrough: z.array(z.string().min(1)).min(2).max(4),
        deliverable: z.string().min(1),
      }),
    )
    .min(1)
    .max(3),
});

export interface RunQuizAndWalkthroughInput {
  context: StepAgentTaskContext;
  stepsPlan: StepsPlan;
  resolvedTools: {
    video?: VideoToolData;
    concept_explainer?: ConceptExplainerData;
  };
}

export interface RunQuizAndWalkthroughOutput {
  taskContent: TaskContent;
  jevAlignmentScore: number;
}

function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

function buildResolvedToolsContext(resolvedTools: {
  video?: VideoToolData;
  concept_explainer?: ConceptExplainerData;
}): string {
  const parts: string[] = [];

  if (resolvedTools.video) {
    const v = resolvedTools.video;
    const momentsText = (v.keyMoments ?? [])
      .map((km) => `- ${formatMmSs(km.timestampSeconds)}: ${km.label}`)
      .join("\n");
    parts.push(
      `[TOOL: video]\nTítulo: "${v.title}" (${v.channel ?? "YouTube"})\nTrecho recortado: ${formatMmSs(v.watchStartSeconds)} até ${formatMmSs(v.watchEndSeconds)}\nResumo do trecho: ${v.transcriptSummary ?? ""}\nMomentos-chave:\n${momentsText || "- Sem momentos adicionais"}`,
    );
  }

  if (resolvedTools.concept_explainer) {
    const c = resolvedTools.concept_explainer;
    parts.push(
      `[TOOL: concept_explainer]\nTítulo do guia: "${c.title}"\nConteúdo Markdown (trecho):\n${c.markdown.slice(0, 7500)}`,
    );
  }

  return parts.join("\n\n---\n\n");
}

async function generateRecallQuiz(
  context: StepAgentTaskContext,
  quizMinutes: number,
  quizGoal: string,
  toolsContext: string,
): Promise<RecallQuizData> {
  const previousFeedback = formatPreviousFeedbackSummary(context.previousFeedback);

  const { output } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: RecallQuizLlmSchema,
      name: "ActiveRecallQuiz",
      description:
        "Quiz dinâmico de fixação ancorado no conteúdo real das tools anteriores da sessão.",
    }),
    system: `${BASE_SYSTEM_PROMPT}

Você é o criador do quiz de fixação ("active_recall_quiz") do Glint.
Regras obrigatórias:
1. Decida dinamicamente entre 2 e 5 perguntas conforme o tempo do step (${quizMinutes} min) e a densidade do conteúdo estudado.
2. Cada pergunta deve testar compreensão prática e aplicação real do que foi visto no vídeo e/ou no guia concept_explainer da sessão — nunca faça perguntas genéricas fora do material.
3. Cada pergunta deve ter 3 ou 4 alternativas com IDs curtos ("opt_a", "opt_b", "opt_c", "opt_d"), onde TODA alternativa traz uma "explanation" clara explicando por que está certa ou errada.
4. "correctOptionId" DEVE corresponder exatamente a um dos "id" dentro de "options" daquela pergunta.
5. "explanation" no nível da pergunta é a síntese do mentor exibida após o aluno responder.
6. Zero pontos de exclamação.`,
    prompt: `Sessão: "${context.title}"
Objetivo do quiz: "${quizGoal}"
Feedback da sessão anterior:
${previousFeedback}

Material real estudado nesta sessão:
${toolsContext || `Tema: ${context.title} — ${context.whyItMatters}`}`,
  });

  const normalizedQuestions = output.questions.map((q, idx) => {
    const validOptions = q.options.map((opt, optIdx) => ({
      id: opt.id.trim() || `opt_${String.fromCharCode(97 + optIdx)}`,
      text: opt.text.trim(),
      explanation: opt.explanation.trim(),
    }));
    const hasMatchingCorrect = validOptions.some(
      (opt) => opt.id === q.correctOptionId,
    );
    const correctOptionId = hasMatchingCorrect
      ? q.correctOptionId
      : validOptions[0].id;

    return {
      id: `q_${String(idx + 1).padStart(2, "0")}`,
      question: q.question.trim(),
      options: validOptions,
      correctOptionId,
      explanation: q.explanation.trim(),
    };
  });

  return RecallQuizSchema.parse({ questions: normalizedQuestions });
}

/**
 * Tool 3 + Final JIT Synthesis (`Tool -> Walkthrough`): generates the dynamic
 * `active_recall_quiz` (when required) grounded in prior resolved tools,
 * synthesizes timestamp/section-anchored walkthroughs for every step, validates
 * the full `TaskContentSchema`, and scores alignment via `checkWithJev`.
 */
export async function runQuizAndWalkthroughAgent({
  context,
  stepsPlan,
  resolvedTools,
}: RunQuizAndWalkthroughInput): Promise<RunQuizAndWalkthroughOutput> {
  const toolsContext = buildResolvedToolsContext(resolvedTools);
  const quizStep = stepsPlan.steps.find((s) => s.tool === "active_recall_quiz");

  const activeRecallQuiz = quizStep
    ? await generateRecallQuiz(
        context,
        quizStep.estimatedMinutes,
        quizStep.goal,
        toolsContext,
      )
    : undefined;

  const toolsPayload = {
    ...(resolvedTools.video ? { video: resolvedTools.video } : {}),
    ...(resolvedTools.concept_explainer
      ? { concept_explainer: resolvedTools.concept_explainer }
      : {}),
    ...(activeRecallQuiz ? { active_recall_quiz: activeRecallQuiz } : {}),
  };

  const plannedStepsSummary = stepsPlan.steps
    .map(
      (s) =>
        `- stepId="${s.stepId}" | order=${s.order} | phase=${s.phase} | estimatedMinutes=${s.estimatedMinutes} | tool="${s.tool}" | goal="${s.goal}"`,
    )
    .join("\n");

  const quizSummaryForWalkthrough = activeRecallQuiz
    ? `\n\n[TOOL: active_recall_quiz]\nQuantidade de perguntas geradas: ${activeRecallQuiz.questions.length}`
    : "";

  const { output: walkthroughOutput } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: WalkthroughSynthesisLlmSchema,
      name: "SessionStepsWalkthrough",
      description:
        "Walkthrough passo a passo e deliverable de cada step ancorados nos insumos reais das tools.",
    }),
    system: `${BASE_SYSTEM_PROMPT}

Você está na síntese final (Tool -> Walkthrough) de uma sessão do Glint.
Para CADA step listado no blueprint abaixo, gere title, objective, walkthrough (2 a 4 passos acionáveis) e deliverable concreto.

Regras obrigatórias:
1. Mantenha o mesmo "stepId" de cada item do blueprint.
2. Ancore o "walkthrough" nos materiais REAIS já resolvidos:
   - Se a tool for "video": cite explicitamente os timestamps reais (ex.: "Inicie em 01:15...", "Em 04:00 repare em...") e os keyMoments.
   - Se a tool for "concept_explainer": cite seções, diagramas Mermaid ou tabelas comparativas reais do guia e oriente como aplicar na prática.
   - Se a tool for "active_recall_quiz": oriente o aluno a responder às ${activeRecallQuiz?.questions.length ?? "várias"} perguntas sem consultar o material e revisar as justificativas.
3. "deliverable" deve ser um resultado verificável em 1 frase curta.
4. Zero pontos de exclamação.`,
    prompt: `Sessão: "${context.title}"
Por que importa: ${context.whyItMatters}
${stepsPlan.adaptationNote ? `Nota de adaptação: ${stepsPlan.adaptationNote}` : ""}

Blueprint dos steps:
${plannedStepsSummary}

Insumos reais resolvidos:
${toolsContext}${quizSummaryForWalkthrough}`,
  });

  const synthesizedSteps: SessionStepData[] = stepsPlan.steps.map((planned) => {
    const match =
      walkthroughOutput.steps.find((s) => s.stepId === planned.stepId) ??
      walkthroughOutput.steps[planned.order - 1];

    return SessionStepSchema.parse({
      id: planned.stepId,
      order: planned.order,
      phase: planned.phase,
      estimatedMinutes: planned.estimatedMinutes,
      toolRef: planned.tool,
      title: match?.title?.trim() || planned.goal,
      objective: match?.objective?.trim() || planned.goal,
      walkthrough:
        match?.walkthrough?.map((w) => w.trim()).filter(Boolean) ?? [planned.goal],
      deliverable: match?.deliverable?.trim() || context.whyItMatters,
    });
  });

  const taskContent = TaskContentSchema.parse({
    tools: toolsPayload,
    steps: synthesizedSteps,
  });

  const jevAlignment = await checkWithJev({
    state: `Objetivo macro: ${context.refinedGoal}\nSessão: ${context.title} (${context.whyItMatters})\nSteps gerados:\n${taskContent.steps.map((s) => `${s.order}. [${s.toolRef}] ${s.title} -> ${s.deliverable}`).join("\n")}`,
    instructions:
      "Avalie se os steps e materiais gerados para esta sessão entregam exatamente o aprendizado proposto no título e no whyItMatters da sessão.",
    threshold: 0.7,
  });

  return {
    taskContent,
    jevAlignmentScore: jevAlignment.confidence,
  };
}
