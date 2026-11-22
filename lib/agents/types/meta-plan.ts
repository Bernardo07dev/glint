import { z } from "zod";

export const MetaPlanStepOutputSchema = z.object({
  id: z.string().min(2),
  questionGoal: z.string().min(5),
  criteriaForJev: z.string().min(5),
});

export const MetaPlanOutputSchema = z.object({
  steps: z.array(MetaPlanStepOutputSchema).min(2).max(6),
});

export interface ExecutableStep {
  id: string;
  questionGoal: string;
  criteriaForJev: string;
  value: string | null;
  jevConfidence: number;
  status: "pending" | "completed";
}

export interface ExecutableMeta {
  refinedGoal: string;
  steps: ExecutableStep[];
}
