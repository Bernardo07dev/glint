import { z } from "zod";
import type { QuestionAnswer } from "@/app/components/ai/types";

export const ScheduleSlotSchema = z.object({
  day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  startTime: z.string().min(1),
  durationMinutes: z.number().int().positive(),
});

export const QuestionAnswerSchema: z.ZodType<QuestionAnswer> =
  z.discriminatedUnion("inputType", [
    z.object({
      inputType: z.literal("text"),
      value: z.string().trim().min(1),
    }),
    z.object({
      inputType: z.literal("single_choice"),
      value: z.string().trim().min(1),
      customText: z.string().trim().optional(),
    }),
    z.object({
      inputType: z.literal("multi_choice"),
      values: z.array(z.string().trim().min(1)),
      customText: z.string().trim().optional(),
    }),
    z.object({
      inputType: z.literal("schedule_picker"),
      slots: z.array(ScheduleSlotSchema).min(1),
    }),
  ]);

export const PlanApiRequestSchema = z.object({
  planId: z.string().min(1),
  answer: QuestionAnswerSchema.optional(),
  action: z.enum(["accept_plan", "adjust_plan"]).optional(),
  feedback: z.string().trim().min(2).optional(),
});
