import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const MODEL_IDS = {
  architect: "google/gemini-4-hydrogen",
  fast: "openai/gpt-6.1-terra",
  lowCost: "anthropic/claude-haiku-5.5",
  jev: "typesafe/jev-1.14",
} as const;

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  appName: "Glint",
  compatibility: "strict",
});

export const models = {
  architect: openrouter.chat(MODEL_IDS.architect),
  fast: openrouter.chat(MODEL_IDS.fast),
  lowCost: openrouter.chat(MODEL_IDS.lowCost),
  jev: openrouter.evaluationModel(MODEL_IDS.jev),
};

export type JevState = Parameters<typeof models.jev.doEvaluate>[0]["state"];

export interface CheckWithJevInput {
  state: JevState;
  instructions: string;
  threshold?: number;
}

export interface CheckWithJevResult {
  approved: boolean;
  confidence: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export async function checkWithJev(
  { state, instructions, threshold = 0.70, }: CheckWithJevInput): Promise<CheckWithJevResult>
{
  const result = await models.jev.doEvaluate({
    state,
    questions: {
      approved: {
        type: "boolean",
        instructions,
      },
    },
  });

  const answer = result.answers.approved;
  const confidence = answer?.type === "boolean" ? answer.probability : 0;

  return {
    approved: confidence >= threshold,
    confidence,
    usage: result.usage,
  };
}
