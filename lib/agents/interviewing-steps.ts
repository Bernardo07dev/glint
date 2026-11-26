import { generateText, Output } from "ai";
import type { QuestionPayload } from "@/app/components/ai/types";
import { checkWithJev, models } from "@/lib/infra/llm";
import { BASE_SYSTEM_PROMPT } from "./prompts";
import {
  InterviewQuestionOutputSchema,
  StepExtractionOutputSchema,
  type AgentConversationMessage,
  type ExecutableMeta,
  type ExecutableStep,
  type InterviewingStepsResult,
} from "./types";

const JEV_STEP_THRESHOLD = 0.7;
const MAX_STEP_ATTEMPTS = 2;

export interface RunInterviewingStepsInput {
  refinedGoal: string;
  executableMeta: ExecutableMeta;
  currentStepId: string | null;
  messages: AgentConversationMessage[];
  latestUserAnswer?: string;
  attemptsForCurrentStep?: number;
}

async function extractStepUpdates(input: {
  executableMeta: ExecutableMeta;
  currentStepId: string | null;
  answerText: string;
}): Promise<Array<{ stepId: string; extractedValue: string }>> {
  const pendingSteps = input.executableMeta.steps.filter(
    (step) => step.status === "pending",
  );
  if (pendingSteps.length === 0) return [];

  const stepsSummary = pendingSteps
    .map(
      (step) =>
        `- id: "${step.id}" | objetivo: ${step.questionGoal} | critério: ${step.criteriaForJev}`,
    )
    .join("\n");

  const { output } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: StepExtractionOutputSchema,
      name: "StepExtraction",
      description:
        "Extrai valores da resposta do usuário para o step atual e eventuais outros steps pendentes respondidos junto.",
    }),
    system: `Você extrai informações objetivas da resposta do aluno para preencher os steps pendentes do plano.
- Foque principalmente no step atual ("${input.currentStepId ?? pendingSteps[0]?.id}").
- Se o aluno também respondeu claramente a outro step pendente na mesma mensagem (cross-filling), inclua-o em updates.
- Não invente informações que não estejam na resposta.`,
    prompt: `Steps pendentes:\n${stepsSummary}\n\nResposta do aluno:\n"${input.answerText}"`,
  });

  return output.updates;
}

async function evaluateUpdatedSteps(input: {
  executableMeta: ExecutableMeta;
  updates: Array<{ stepId: string; extractedValue: string }>;
  currentStepId: string | null;
  attemptsForCurrentStep: number;
}): Promise<ExecutableMeta> {
  const updatesMap = new Map(
    input.updates.map((u) => [u.stepId, u.extractedValue]),
  );

  const nextSteps: ExecutableStep[] = await Promise.all(
    input.executableMeta.steps.map(async (step) => {
      if (step.status === "completed") return step;

      const extractedValue = updatesMap.get(step.id);
      if (!extractedValue) return step;

      if (step.id === "routine_and_slots") {
        return {
          ...step,
          value: extractedValue,
          jevConfidence: 1,
          status: "completed" as const,
        };
      }

      const jev = await checkWithJev({
        state: {
          questionGoal: step.questionGoal,
          userResponse: extractedValue,
        },
        instructions: step.criteriaForJev,
        threshold: JEV_STEP_THRESHOLD,
      });

      const forceComplete =
        step.id === input.currentStepId &&
        input.attemptsForCurrentStep >= MAX_STEP_ATTEMPTS;

      return {
        ...step,
        value: extractedValue,
        jevConfidence: jev.confidence,
        status: jev.approved || forceComplete ? "completed" : "pending",
      };
    }),
  );

  return {
    ...input.executableMeta,
    steps: nextSteps,
  };
}

async function generateStepQuestion(input: {
  refinedGoal: string;
  step: ExecutableStep;
  messages: AgentConversationMessage[];
}): Promise<QuestionPayload> {
  const transcript =
    input.messages.length > 0
      ? input.messages
          .map(
            (m) =>
              `${m.role === "assistant" ? "Mentor" : "Aluno"}: ${m.content}`,
          )
          .join("\n")
      : "Nenhuma pergunta feita nesta etapa ainda.";

  const { output } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: InterviewQuestionOutputSchema,
      name: "InterviewQuestion",
      description:
        "Próxima pergunta estruturada para coletar as informações do step atual.",
    }),
    system: `${BASE_SYSTEM_PROMPT}

Você está na Etapa 3 (Entrevista dos Steps).
Faça UMA pergunta simples, leve e objetiva para avançar apenas no step atual — construa o plano aos poucos junto com o aluno, sem pedir tudo de uma vez.

Regras de formato:
- Se o step atual tiver id "routine_and_slots", use OBRIGATORIAMENTE inputType = "schedule_picker", defaultDurationMinutes = 45, options = null, placeholder = null, allowCustom = false.
- Para todos os outros steps, PRIORIZE SEMPRE questões de opção ("single_choice" ou "multi_choice"), pois são muito mais rápidas e fáceis de responder do que digitar:
  - "single_choice": 3–4 opções curtas e claras, allowCustom = true, placeholder = null, defaultDurationMinutes = null.
  - "multi_choice": quando o aluno puder marcar mais de uma preferência/ferramenta, allowCustom = true, placeholder = null, defaultDurationMinutes = null.
  - "text": evite ao máximo; use APENAS se opções fechadas realmente não fizerem sentido para o step (nesse caso, options = null, allowCustom = false, defaultDurationMinutes = null, com placeholder concreto).
- Se o step já tiver um "value" parcial (tentativa anterior reprovada), faça uma pergunta curta de complemento (também preferindo "single_choice" quando possível).`,
    prompt: `Objetivo final do aluno: "${input.refinedGoal}"

Step atual:
- id: ${input.step.id}
- questionGoal: ${input.step.questionGoal}
- criteriaForJev: ${input.step.criteriaForJev}
- valor parcial atual: ${input.step.value ?? "nenhum"}

Histórico recente:\n${transcript}`,
  });

  return {
    id: `step_${input.step.id}_${crypto.randomUUID().slice(0, 6)}`,
    question: output.question,
    inputType: output.inputType,
    ...(output.placeholder ? { placeholder: output.placeholder } : {}),
    ...(output.options?.length ? { options: output.options } : {}),
    allowCustom: output.allowCustom,
    ...(output.defaultDurationMinutes
      ? { defaultDurationMinutes: output.defaultDurationMinutes }
      : {}),
  };
}

export async function runInterviewingStepsAgent(
  input: RunInterviewingStepsInput,
): Promise<InterviewingStepsResult> {
  let meta = input.executableMeta;

  if (input.latestUserAnswer) {
    const updates = await extractStepUpdates({
      executableMeta: meta,
      currentStepId: input.currentStepId,
      answerText: input.latestUserAnswer,
    });

    meta = await evaluateUpdatedSteps({
      executableMeta: meta,
      updates,
      currentStepId: input.currentStepId,
      attemptsForCurrentStep: input.attemptsForCurrentStep ?? 1,
    });
  }

  const nextStep = meta.steps.find((step) => step.status === "pending");

  if (!nextStep) {
    return {
      status: "STAGE_COMPLETED",
      executableMeta: meta,
    };
  }

  const question = await generateStepQuestion({
    refinedGoal: input.refinedGoal,
    step: nextStep,
    messages: input.messages,
  });

  return {
    status: "NEEDS_USER_INPUT",
    question,
    executableMeta: meta,
    currentStepId: nextStep.id,
  };
}
