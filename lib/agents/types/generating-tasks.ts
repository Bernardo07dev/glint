import { z } from "zod";

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
