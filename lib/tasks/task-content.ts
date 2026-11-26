import { z } from "zod";

// Contrato de `PlanTask.content` (steering/TaskCreation.md — seções 3 e 8).
// Fonte única: o worker valida a saída com estes schemas antes de salvar,
// e a página da sessão faz `parseTaskContent` ao ler o JSON do banco.

export const ToolIdSchema = z.enum(["video", "concept_explainer", "active_recall_quiz"]);

export const VideoKeyMomentSchema = z.object({
  timestampSeconds: z.number().nonnegative(),
  label: z.string().min(1),
});

export const VideoToolSchema = z
  .object({
    provider: z.string().min(1),
    videoId: z.string().min(1),
    title: z.string().min(1),
    channel: z.string().optional(),
    durationSeconds: z.number().positive().optional(),
    watchStartSeconds: z.number().nonnegative(),
    watchEndSeconds: z.number().positive(),
    transcriptSummary: z.string().optional(),
    keyMoments: z.array(VideoKeyMomentSchema).optional(),
  })
  .refine((v) => v.watchEndSeconds > v.watchStartSeconds, {
    message: "watchEndSeconds deve ser maior que watchStartSeconds",
    path: ["watchEndSeconds"],
  });

export const ConceptExplainerSourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
});

export const ConceptExplainerSchema = z.object({
  title: z.string().min(1),
  estimatedReadMinutes: z.number().positive().optional(),
  markdown: z.string().min(1),
  sources: z.array(ConceptExplainerSourceSchema).optional(),
});

export const QuizOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  explanation: z.string().min(1),
});

export const QuizQuestionSchema = z
  .object({
    id: z.string().min(1),
    question: z.string().min(1),
    options: z.array(QuizOptionSchema).min(2),
    correctOptionId: z.string().min(1),
    explanation: z.string().min(1),
  })
  .refine((q) => q.options.some((o) => o.id === q.correctOptionId), {
    message: "correctOptionId precisa existir em options",
    path: ["correctOptionId"],
  });

export const RecallQuizSchema = z.object({
  questions: z.array(QuizQuestionSchema).min(1),
});

export const SessionStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  phase: z.enum(["consume", "practice"]),
  estimatedMinutes: z.number().positive(),
  toolRef: ToolIdSchema,
  title: z.string().min(1),
  objective: z.string().min(1),
  walkthrough: z.array(z.string().min(1)).min(1),
  deliverable: z.string().min(1),
});

export const TaskContentSchema = z
  .object({
    tools: z.object({
      video: VideoToolSchema.optional(),
      concept_explainer: ConceptExplainerSchema.optional(),
      active_recall_quiz: RecallQuizSchema.optional(),
    }),
    steps: z.array(SessionStepSchema).min(1),
  })
  .superRefine((content, ctx) => {
    content.steps.forEach((step, i) => {
      if (!content.tools[step.toolRef]) {
        ctx.addIssue({
          code: "custom",
          message: `step "${step.id}" referencia a tool "${step.toolRef}", ausente em tools`,
          path: ["steps", i, "toolRef"],
        });
      }
    });
    const ids = content.steps.map((s) => s.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "step.id duplicado", path: ["steps"] });
    }
  });

export type ToolId = z.infer<typeof ToolIdSchema>;
export type VideoKeyMoment = z.infer<typeof VideoKeyMomentSchema>;
export type VideoToolData = z.infer<typeof VideoToolSchema>;
export type ConceptExplainerSource = z.infer<typeof ConceptExplainerSourceSchema>;
export type ConceptExplainerData = z.infer<typeof ConceptExplainerSchema>;
export type QuizOption = z.infer<typeof QuizOptionSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type RecallQuizData = z.infer<typeof RecallQuizSchema>;
export type SessionStepData = z.infer<typeof SessionStepSchema>;
export type TaskContent = z.infer<typeof TaskContentSchema>;

// Step já ligado ao payload da sua tool — é isso que cada página de step recebe.
export type ResolvedStep =
  | { toolRef: "video"; step: SessionStepData; tool: VideoToolData }
  | { toolRef: "concept_explainer"; step: SessionStepData; tool: ConceptExplainerData }
  | { toolRef: "active_recall_quiz"; step: SessionStepData; tool: RecallQuizData };

/** Lê `PlanTask.content` (Json do Prisma) com validação. Retorna `null` se vazio ou inválido. */
export function parseTaskContent(raw: unknown): TaskContent | null {
  if (raw == null) return null;
  const parsed = TaskContentSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[task-content] PlanTask.content inválido", parsed.error.issues);
    return null;
  }
  return parsed.data;
}

/** Liga cada step (em ordem) ao conteúdo da tool referenciada por `toolRef`. */
export function resolveSteps(content: TaskContent): ResolvedStep[] {
  return [...content.steps]
    .sort((a, b) => a.order - b.order)
    .map((step) => ({ toolRef: step.toolRef, step, tool: content.tools[step.toolRef] }) as ResolvedStep);
}
