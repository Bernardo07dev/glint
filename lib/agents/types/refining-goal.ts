import { z } from "zod";
import type { QuestionPayload } from "@/app/components/ai/types";

export const RefiningQuestionOutputSchema = z.object({
  question: z.string().min(5),
  inputType: z.enum(["single_choice", "text"]),
  placeholder: z.string().nullable(),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .nullable(),
  allowCustom: z.boolean(),
});

export const RefinedGoalOutputSchema = z.object({
  refinedGoal: z.string().min(5),
});

export type RefiningGoalResult =
  | {
      status: "NEEDS_USER_INPUT";
      question: QuestionPayload;
      jevConfidence: number;
    }
  | {
      status: "STAGE_COMPLETED";
      refinedGoal: string;
      jevConfidence: number;
    };
