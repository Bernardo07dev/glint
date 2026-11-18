import { z } from "zod";
import type {
  QuestionAnswer,
  QuestionPayload,
} from "@/app/components/ai/types";

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

export const PlanDayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const RequiredToolSchema = z.enum([
  "youtube_video",
  "practice_checklist",
  "markdown_math",
  "code_sandbox",
]);

export const GeneratingTasksOutputSchema = z.object({
  successCriteria: z.array(z.string()),
  routineContract: z.object({
    totalWeeks: z.number(),
    weeklyHours: z.number(),
    slots: z.array(
      z.object({
        dayOfWeek: PlanDayOfWeekSchema,
        startTime: z.string(),
        maxMinutes: z.number(),
        energyLevel: z.enum(["low", "medium", "high"]),
      }),
    ),
  }),
  tasks: z.array(
    z.object({
      title: z.string(),
      whyItMatters: z.string(),
      date: z.string(),
      dayOfWeek: PlanDayOfWeekSchema,
      startTime: z.string(),
      durationMinutes: z.number(),
      consumeMinutes: z.number(),
      practiceMinutes: z.number(),
      taskType: z.string(),
      requiredTools: z.array(RequiredToolSchema),
      searchQueryUsed: z.string(),
    }),
  ),
});

export type PlanDayOfWeek = z.infer<typeof PlanDayOfWeekSchema>;
export type RequiredTool = z.infer<typeof RequiredToolSchema>;

export interface PlanTask {
  taskId: string;
  order: number;
  title: string;
  whyItMatters: string;
  schedule: {
    date: string;
    dayOfWeek: PlanDayOfWeek;
    startTime: string;
    durationMinutes: number;
    timeBreakdown: {
      consumeMinutes: number;
      practiceMinutes: number;
    };
  };
  lockState: {
    isLocked: boolean;
    unlockAt: string;
  };
  pedagogy: {
    taskType: string;
    requiredTools: RequiredTool[];
  };
  backgroundWorker: {
    enrichmentStatus: "queued" | "completed" | "failed";
    searchQueryUsed: string;
    jevAlignmentScore: number | null;
  };
  content: unknown | null;
}

export interface PlanStructure {
  planId: string;
  status: "enriching" | "active" | "completed";
  objective: {
    rawInput: string;
    clearGoal: string;
    successCriteria: string[];
  };
  routineContract: {
    timezone: string;
    totalWeeks: number;
    weeklyHours: number;
    slots: Array<{
      dayOfWeek: PlanDayOfWeek;
      startTime: string;
      maxMinutes: number;
      energyLevel: "low" | "medium" | "high";
    }>;
  };
  tasks: PlanTask[];
}

export interface AgentConversationMessage {
  role: "user" | "assistant";
  content: string;
}

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

export function serializeQuestionMessage(question: QuestionPayload): string {
  return JSON.stringify(question);
}

export function parseStoredQuestion(content: string): QuestionPayload | null {
  try {
    const parsed = JSON.parse(content) as Partial<QuestionPayload>;
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.question === "string" &&
      typeof parsed.inputType === "string"
    ) {
      return parsed as QuestionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

function resolveOptionLabel(
  optionId: string,
  lastQuestion?: QuestionPayload | null,
): string {
  const match = lastQuestion?.options?.find((opt) => opt.id === optionId);
  if (!match) return optionId;
  return match.description
    ? `${match.label} (${match.description})`
    : match.label;
}

export function formatAnswerToText(
  answer: QuestionAnswer,
  lastQuestion?: QuestionPayload | null,
): string {
  switch (answer.inputType) {
    case "text":
      return answer.value.trim();

    case "single_choice": {
      if (answer.value === "custom" && answer.customText) {
        return answer.customText.trim();
      }
      return resolveOptionLabel(answer.value, lastQuestion);
    }

    case "multi_choice": {
      const labels = answer.values.map((id) =>
        resolveOptionLabel(id, lastQuestion),
      );
      if (answer.customText?.trim()) {
        labels.push(answer.customText.trim());
      }
      return labels.join("; ");
    }

    case "schedule_picker":
      return answer.slots
        .map(
          (slot) =>
            `${slot.day} às ${slot.startTime} (${slot.durationMinutes} min)`,
        )
        .join(", ");
  }
}

export function formatHistoryForAgent(
  messages: Array<{ role: "USER" | "ASSISTANT"; content: string }>,
): AgentConversationMessage[] {
  return messages.map((message) => {
    if (message.role === "USER") {
      return { role: "user", content: message.content };
    }

    const parsed = parseStoredQuestion(message.content);
    if (!parsed) {
      return { role: "assistant", content: message.content };
    }

    const optionsSummary = parsed.options?.length
      ? ` Opções oferecidas: ${parsed.options.map((o) => o.label).join(" | ")}`
      : "";

    return {
      role: "assistant",
      content: `${parsed.question}${optionsSummary}`,
    };
  });
}
