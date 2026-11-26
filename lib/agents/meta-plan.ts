import { generateText, Output } from "ai";
import { models } from "@/lib/infra/llm";
import { BASE_SYSTEM_PROMPT } from "./prompts";
import { MetaPlanOutputSchema, type ExecutableMeta } from "./types";

export interface RunMetaPlanInput {
  rawInput: string;
  refinedGoal: string;
  knowledgeGraph?: string | null;
}

export async function runMetaPlanAgent({
  rawInput,
  refinedGoal,
  knowledgeGraph,
}: RunMetaPlanInput): Promise<ExecutableMeta> {
  const contextParts = [
    `Objetivo refinado (clearGoal): "${refinedGoal}"`,
    `Pedido original: "${rawInput}"`,
  ];

  if (knowledgeGraph?.trim()) {
    contextParts.push(`Contexto prévio do aluno: ${knowledgeGraph.trim()}`);
  }

  const { output } = await generateText({
    model: models.architect,
    output: Output.object({
      schema: MetaPlanOutputSchema,
      name: "MetaPlan",
      description:
        "Lista de steps investigativos específicos do domínio para coletar tudo que falta antes de montar o plano final.",
    }),
    system: `${BASE_SYSTEM_PROMPT}

Você está na Etapa 2 (Criação do Meta-Plano / "Plano pro Plano").
O objetivo do aluno já está claro. Agora você deve definir exatamente quais informações precisa descobrir na entrevista antes de montar o cronograma de estudo.

Regras para gerar os steps:
- Gere de 3 a 5 steps objetivos, sem redundância.
- Cada step deve ter:
  - "id": identificador curto em snake_case (ex.: "current_level", "target_context", "learning_style", "routine_and_slots").
  - "questionGoal": o que precisa ser descoberto sobre o aluno naquele step.
  - "criteriaForJev": critério objetivo e verificável que a resposta do aluno precisa satisfazer para o step ser considerado completo.
- Adapte os steps ao domínio específico do objetivo (ex.: idioma pede nível atual e contexto de uso; programação pede stack/ambiente e projeto-alvo; corrida pede condicionamento e histórico de lesões).
- Inclua OBRIGATORIAMENTE um último step com id "routine_and_slots" para mapear dias da semana, horários e duração disponível por sessão.`,
    prompt: contextParts.join("\n\n"),
  });

  return {
    refinedGoal,
    steps: output.steps.map((step) => ({
      id: step.id,
      questionGoal: step.questionGoal,
      criteriaForJev: step.criteriaForJev,
      value: null,
      jevConfidence: 0,
      status: "pending",
    })),
  };
}
