import { generateText, Output } from "ai";
import type { QuestionPayload } from "@/app/components/ai/types";
import { checkWithJev, models } from "@/lib/infra/llm";
import { BASE_SYSTEM_PROMPT } from "./prompts";
import {
  RefinedGoalOutputSchema,
  RefiningQuestionOutputSchema,
  type AgentConversationMessage,
  type RefiningGoalResult,
} from "./types";

const MAX_REFINING_TURNS = 2;

const JEV_REFINING_INSTRUCTIONS =
  "Avalie se o objetivo de aprendizado do usuário já expressa um resultado ou marco concreto, específico e executável (por exemplo: 'correr meus primeiros 5 km', 'construir e publicar uma CLI com Claude Code', 'falar inglês com confiança em reuniões de trabalho'), e não apenas um assunto genérico ou vago (por exemplo: 'aprender inglês', 'programação', 'finanças', 'quero correr').";

export interface RunRefiningGoalInput {
  rawInput: string;
  messages: AgentConversationMessage[];
  knowledgeGraph?: string | null;
}

function buildGoalContext({
  rawInput,
  messages,
  knowledgeGraph,
}: RunRefiningGoalInput): string {
  const sections = [`Pedido inicial do usuário: "${rawInput.trim()}"`];

  if (knowledgeGraph?.trim()) {
    sections.push(`Contexto prévio do aluno (Knowledge Graph): ${knowledgeGraph.trim()}`);
  }

  if (messages.length > 0) {
    const transcript = messages
      .map((m) => `${m.role === "assistant" ? "Mentor" : "Aluno"}: ${m.content}`)
      .join("\n");
    sections.push(`Conversa de refinamento:\n${transcript}`);
  }

  return sections.join("\n\n");
}

async function consolidateRefinedGoal(
  input: RunRefiningGoalInput,
): Promise<string> {
  if (input.messages.length === 0) {
    return input.rawInput.trim();
  }

  const { output } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: RefinedGoalOutputSchema,
      name: "RefinedGoal",
      description: "Objetivo final consolidado em uma única frase clara e executável.",
    }),
    system: `${BASE_SYSTEM_PROMPT}

Sua tarefa agora é consolidar o pedido inicial do usuário e as respostas de refinamento em UM único objetivo final (refinedGoal):
- Uma única frase direta, específica e mensurável em português brasileiro.
- Sem pontuação excessiva, sem explicações extras e sem repetir perguntas.`,
    prompt: buildGoalContext(input),
  });

  return output.refinedGoal.trim();
}

async function generateNextRefiningQuestion(
  input: RunRefiningGoalInput,
): Promise<QuestionPayload> {
  const { output } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: RefiningQuestionOutputSchema,
      name: "RefiningQuestion",
      description: "Uma pergunta única para transformar o desejo vago do aluno em um objetivo concreto.",
    }),
    system: `${BASE_SYSTEM_PROMPT}

Você está na Etapa 1 (Refinamento do Objetivo).
O pedido atual do aluno ainda está amplo demais para montar um plano prático.
Faça UMA única pergunta cirúrgica para ajudar o aluno a definir o resultado concreto que ele quer alcançar ao final da jornada.

Regras para montar a pergunta:
- NÃO pergunte sobre rotina, dias da semana, horários ou nível técnico ainda (isso virá depois). Foque exclusivamente em clarificar O QUE ele quer ser capaz de fazer ou entregar ao final.
- Prefira "single_choice" com 3 ou 4 opções concretas e realistas baseadas no tema do aluno, sempre com allowCustom = true para ele escrever outro caminho se preferir.
- Use "text" apenas quando opções pré-definidas não fizerem sentido (nesse caso, options = null, allowCustom = false e forneça um placeholder concreto).
- Em single_choice, forneça placeholder = null e preencha id curto em snake_case, label conciso e description de 1 frase para cada opção.
- Não repita perguntas já feitas na conversa.`,
    prompt: buildGoalContext(input),
  });

  return {
    id: `refine_${crypto.randomUUID().slice(0, 8)}`,
    question: output.question,
    inputType: output.inputType,
    ...(output.placeholder ? { placeholder: output.placeholder } : {}),
    ...(output.options?.length ? { options: output.options } : {}),
    allowCustom: output.allowCustom,
  };
}

export async function runRefiningGoalAgent(
  input: RunRefiningGoalInput,
): Promise<RefiningGoalResult> {
  const state = buildGoalContext(input);
  const assistantTurns = input.messages.filter(
    (message) => message.role === "assistant",
  ).length;

  const jevResult = await checkWithJev({
    state,
    instructions: JEV_REFINING_INSTRUCTIONS,
    threshold: 0.7,
  });

  if (jevResult.approved || assistantTurns >= MAX_REFINING_TURNS) {
    const refinedGoal = await consolidateRefinedGoal(input);
    return {
      status: "STAGE_COMPLETED",
      refinedGoal,
      jevConfidence: jevResult.confidence,
    };
  }

  const question = await generateNextRefiningQuestion(input);
  return {
    status: "NEEDS_USER_INPUT",
    question,
    jevConfidence: jevResult.confidence,
  };
}
