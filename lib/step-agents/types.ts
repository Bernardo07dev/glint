import { z } from "zod";
import type { ExecutableMeta } from "@/lib/agents/types";
import {
  ToolIdSchema,
  type ConceptExplainerData,
  type RecallQuizData,
  type SessionStepData,
  type TaskContent,
  type ToolId,
  type VideoToolData,
} from "@/lib/task-content";

export const StepBlueprintItemSchema = z.object({
  stepId: z.string().min(1),
  order: z.number().int().positive(),
  phase: z.enum(["consume", "practice"]),
  estimatedMinutes: z.number().int().positive(),
  tool: ToolIdSchema,
  goal: z.string().min(1),
});

export const StepsPlanSchema = z.object({
  adaptationNote: z.string().nullable(),
  steps: z.array(StepBlueprintItemSchema).min(1).max(3),
});

export type StepBlueprintItem = z.infer<typeof StepBlueprintItemSchema>;
export type StepsPlan = z.infer<typeof StepsPlanSchema>;

export interface PreviousTaskFeedback {
  previousTaskTitle?: string;
  difficultyRating?: string | null;
  userNotes?: string | null;
}

export interface StepAgentTaskContext {
  planId: string;
  taskKey: string;
  order: number;
  title: string;
  whyItMatters: string;
  taskType: string;
  requiredTools: string[];
  searchQueryUsed: string;
  durationMinutes: number;
  consumeMinutes: number;
  practiceMinutes: number;
  refinedGoal: string;
  rawInput?: string;
  executableMeta?: ExecutableMeta | Record<string, unknown> | null;
  previousFeedback?: PreviousTaskFeedback | null;
  preferredLanguage?: string;
}

export interface ResolvedStepTools {
  video?: VideoToolData;
  concept_explainer?: ConceptExplainerData;
  active_recall_quiz?: RecallQuizData;
}

export type {
  ConceptExplainerData,
  RecallQuizData,
  SessionStepData,
  TaskContent,
  ToolId,
  VideoToolData,
};

/** Formats collected onboarding/meta-plan steps from `executableMeta` for step-agent prompts. */
export function formatLearnerProfileSummary(
  executableMeta?: ExecutableMeta | Record<string, unknown> | null,
): string {
  if (!executableMeta || typeof executableMeta !== "object") {
    return "Perfil do aluno não detalhado.";
  }

  const rawSteps = (executableMeta as { steps?: unknown }).steps;
  if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
    return "Perfil do aluno não detalhado.";
  }

  const lines = rawSteps
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const step = item as Record<string, unknown>;
      const id = typeof step.id === "string" ? step.id : "step";
      const goal =
        typeof step.questionGoal === "string" ? step.questionGoal : "Informação";
      const value =
        typeof step.value === "string" && step.value.trim().length > 0
          ? step.value.trim()
          : null;
      return value ? `- [${id}] ${goal}: ${value}` : null;
    })
    .filter((line): line is string => Boolean(line));

  return lines.length > 0 ? lines.join("\n") : "Perfil do aluno não detalhado.";
}

/** Formats feedback from the immediately preceding session, if present. */
export function formatPreviousFeedbackSummary(
  previousFeedback?: PreviousTaskFeedback | null,
): string {
  if (!previousFeedback) return "Nenhum feedback anterior (primeira sessão ou sem registro).";

  const parts: string[] = [];
  if (previousFeedback.previousTaskTitle) {
    parts.push(`Sessão anterior: "${previousFeedback.previousTaskTitle}"`);
  }
  if (previousFeedback.difficultyRating) {
    parts.push(`Dificuldade percebida: ${previousFeedback.difficultyRating}`);
  }
  if (previousFeedback.userNotes?.trim()) {
    parts.push(`Notas/dúvidas do aluno: "${previousFeedback.userNotes.trim()}"`);
  }

  return parts.length > 0
    ? parts.join("\n")
    : "Nenhum feedback anterior (primeira sessão ou sem registro).";
}
