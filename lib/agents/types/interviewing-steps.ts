import { z } from "zod";
import type { QuestionPayload } from "@/app/components/ai/types";
import type { ExecutableMeta } from "./meta-plan";

export const InterviewQuestionOutputSchema = z.object({
  question: z.string().min(5),
  inputType: z.enum(["text", "single_choice", "multi_choice", "schedule_picker"]),
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
  defaultDurationMinutes: z.number().int().positive().nullable(),
});

export const StepExtractionOutputSchema = z.object({
  updates: z.array(
    z.object({
      stepId: z.string().min(1),
      extractedValue: z.string().min(1),
    }),
  ),
});

export type InterviewingStepsResult =
  | {
      status: "NEEDS_USER_INPUT";
      question: QuestionPayload;
      executableMeta: ExecutableMeta;
      currentStepId: string;
    }
  | {
      status: "STAGE_COMPLETED";
      executableMeta: ExecutableMeta;
    };
