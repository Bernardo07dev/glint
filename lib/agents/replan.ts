import { generateText, Output } from "ai";
import { z } from "zod";
import type { PlanTask, ReplanStrategy } from "@prisma/client";
import type { QuestionPayload, ScheduleSlot } from "@/app/components/ai/types";
import { checkWithJev, models } from "@/lib/infra/llm";
import {
  DAY_NAME_PT,
  type PlanStructure,
  type RoutineContract,
  type RoutineSlot,
} from "@/lib/plan/plan-structure";
import type { OccupiedSlot } from "@/lib/schedule/occupied-slots";
import { parseTimeHHmm, zonedDateTimeToUtc } from "@/lib/schedule/task-schedule";
import { BASE_SYSTEM_PROMPT } from "./prompts";

const JEV_REPLAN_THRESHOLD = 0.72;
const MAX_REPLAN_TURNS = 3;

export interface ReplanMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ReplanPreviewTask {
  existingTaskId?: string;
  taskKey: string;
  order: number;
  title: string;
  whyItMatters: string;
  taskType: string;
  requiredTools: Array<"video" | "concept_explainer" | "active_recall_quiz">;
  searchQueryUsed: string;
  scheduledDate: string;
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
  consumeMinutes: number;
  practiceMinutes: number;
  preserveContent?: boolean;
}

export interface ReplanPreview {
  strategy: ReplanStrategy;
  reasonSummary: string;
  summaryOfChanges: string[];
  keptCompletedCount: number;
  objective: {
    rawInput: string;
    clearGoal: string;
    successCriteria: string[];
  };
  routineContract: RoutineContract;
  newFutureTasks: ReplanPreviewTask[];
}

export type ReplanTurnResult =
  | {
      done: false;
      question: QuestionPayload;
    }
  | {
      done: true;
      preview: ReplanPreview;
    };

const SHORT_TO_LONG_DAY: Record<ScheduleSlot["day"], string> = {
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
  sun: "sunday",
};

const DAY_INDEX_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

export function partitionPlanTasks(dbTasks: PlanTask[]): {
  frozenTasks: PlanTask[];
  mutableTasks: PlanTask[];
  nextOrderStart: number;
} {
  const sorted = [...dbTasks].sort((a, b) => a.order - b.order);
  const frozenSet = new Set<string>();
  const frozenTasks: PlanTask[] = [];
  const mutableTasks: PlanTask[] = [];

  for (const task of sorted) {
    if (
      task.status === "COMPLETED" ||
      task.status === "SKIPPED" ||
      task.status === "IN_PROGRESS"
    ) {
      frozenSet.add(task.id);
      frozenTasks.push(task);
    } else {
      mutableTasks.push(task);
    }
  }

  const nextOrderStart =
    frozenTasks.length > 0
      ? Math.max(...frozenTasks.map((t) => t.order)) + 1
      : 1;

  return { frozenTasks, mutableTasks, nextOrderStart };
}

export function normalizeScheduleSlots(slots: ScheduleSlot[]): RoutineSlot[] {
  return slots.map((s) => ({
    dayOfWeek: SHORT_TO_LONG_DAY[s.day] ?? s.day,
    startTime: s.startTime,
    maxMinutes: s.durationMinutes,
  }));
}

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function getIsoWeekday(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Reflow determinístico em TypeScript para SCHEDULE_ONLY:
 * distribui as `mutableTasks` nos novos `slots` a partir de `todayIso`
 * (permitindo hoje se startTime > agora no timezone do aluno), preservando `content` READY.
 */
export function reflowTasksToNewSlots(
  mutableTasks: PlanTask[],
  newSlots: RoutineSlot[],
  todayIso: string,
  timezone: string,
  nextOrderStart: number,
): ReplanPreviewTask[] {
  if (mutableTasks.length === 0 || newSlots.length === 0) return [];

  const nowMs = Date.now();
  const normalizedSlots = [...newSlots].sort((a, b) => {
    const dayDiff =
      (DAY_INDEX_MAP[a.dayOfWeek.toLowerCase()] ?? 0) -
      (DAY_INDEX_MAP[b.dayOfWeek.toLowerCase()] ?? 0);
    if (dayDiff !== 0) return dayDiff;
    const ta = parseTimeHHmm(a.startTime);
    const tb = parseTimeHHmm(b.startTime);
    return ta.hour * 60 + ta.minute - (tb.hour * 60 + tb.minute);
  });

  const assignedDates: Array<{
    date: string;
    dayOfWeek: string;
    startTime: string;
    durationMinutes: number;
  }> = [];

  for (let offset = 0; offset < 365 && assignedDates.length < mutableTasks.length; offset++) {
    const candidateDate = addDaysIso(todayIso, offset);
    const weekday = getIsoWeekday(candidateDate);

    for (const slot of normalizedSlots) {
      if (assignedDates.length >= mutableTasks.length) break;
      const slotWeekday = DAY_INDEX_MAP[slot.dayOfWeek.toLowerCase()];
      if (slotWeekday !== weekday) continue;

      if (offset === 0) {
        const slotStartUtc = zonedDateTimeToUtc(
          candidateDate,
          slot.startTime,
          timezone,
        );
        if (slotStartUtc.getTime() <= nowMs) continue;
      }

      assignedDates.push({
        date: candidateDate,
        dayOfWeek: slot.dayOfWeek.toLowerCase(),
        startTime: slot.startTime,
        durationMinutes: slot.maxMinutes,
      });
    }
  }

  return mutableTasks.map((task, idx) => {
    const slot = assignedDates[idx] ?? {
      date: task.scheduledDate,
      dayOfWeek: task.dayOfWeek,
      startTime: task.startTime,
      durationMinutes: task.durationMinutes,
    };
    const order = nextOrderStart + idx;
    const duration = slot.durationMinutes;
    const ratio =
      task.durationMinutes > 0
        ? task.consumeMinutes / task.durationMinutes
        : 0.5;
    const consumeMinutes = Math.max(5, Math.round(duration * ratio));
    const practiceMinutes = Math.max(5, duration - consumeMinutes);

    return {
      existingTaskId: task.id,
      taskKey: task.taskKey,
      order,
      title: task.title,
      whyItMatters: task.whyItMatters,
      taskType: task.taskType,
      requiredTools: task.requiredTools as Array<
        "video" | "concept_explainer" | "active_recall_quiz"
      >,
      searchQueryUsed: task.searchQueryUsed,
      scheduledDate: slot.date,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      durationMinutes: duration,
      consumeMinutes,
      practiceMinutes,
      preserveContent: true,
    };
  });
}

const ReplanTriageSchema = z.object({
  strategy: z.enum(["SCHEDULE_ONLY", "PARTIAL_REPLAN", "GOAL_PIVOT"]),
  intentSummary: z.string().min(1),
  needsSchedulePicker: z.boolean(),
  missingInfoHint: z.string().nullable(),
});

const ReplanQuestionSchema = z.object({
  question: z.string().min(1),
  helperText: z.string().nullable(),
  inputType: z.enum(["text", "single_choice", "multi_choice"]),
  placeholder: z.string().nullable(),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        description: z.string().nullable(),
      }),
    )
    .nullable(),
  allowCustom: z.boolean().nullable(),
});

const ReplanCompileOutputSchema = z.object({
  reasonSummary: z.string().min(1),
  summaryOfChanges: z.array(z.string().min(1)).min(1).max(4),
  updatedClearGoal: z.string().nullable(),
  updatedSuccessCriteria: z.array(z.string().min(1)).nullable(),
  newFutureTasks: z
    .array(
      z.object({
        title: z.string().min(1),
        whyItMatters: z.string().min(1),
        taskType: z.string().min(1),
        requiredTools: z
          .array(z.enum(["video", "concept_explainer", "active_recall_quiz"]))
          .min(1),
        searchQueryUsed: z.string().min(1),
        scheduledDate: z.string().min(10),
        dayOfWeek: z.string().min(3),
        startTime: z.string().min(4),
        durationMinutes: z.number().int().positive(),
        consumeMinutes: z.number().int().nonnegative(),
        practiceMinutes: z.number().int().nonnegative(),
      }),
    )
    .min(1)
    .max(12),
});

export interface RunReplanTurnInput {
  planTitle: string;
  rawInput: string;
  currentStructure: PlanStructure;
  frozenTasks: PlanTask[];
  mutableTasks: PlanTask[];
  nextOrderStart: number;
  occupiedSlots: OccupiedSlot[];
  todayIso: string;
  timezone: string;
  messages: ReplanMessage[];
  updatedSlots?: ScheduleSlot[];
}

export async function runReplanTurn(
  input: RunReplanTurnInput,
): Promise<ReplanTurnResult> {
  const {
    planTitle,
    rawInput,
    currentStructure,
    frozenTasks,
    mutableTasks,
    nextOrderStart,
    occupiedSlots,
    todayIso,
    timezone,
    messages,
    updatedSlots,
  } = input;

  const userTurns = messages.filter((m) => m.role === "user").length;
  const hasProvidedSlots = Boolean(updatedSlots && updatedSlots.length > 0);

  const currentRoutine = currentStructure.routineContract;
  const currentObjective = currentStructure.objective;
  const currentSlots = currentRoutine?.slots ?? [];
  const effectiveSlots: RoutineSlot[] = hasProvidedSlots
    ? normalizeScheduleSlots(updatedSlots!)
    : currentSlots;

  const conversationText = messages
    .map((m) => `${m.role === "user" ? "Aluno" : "Mentor"}: ${m.content}`)
    .join("\n");

  const frozenSummary =
    frozenTasks.length > 0
      ? frozenTasks
          .map(
            (t) =>
              `- #${t.order} ${t.title} (${t.status}${t.difficultyRating ? `, dificuldade: ${t.difficultyRating}` : ""}${t.userNotes ? `, nota: "${t.userNotes}"` : ""})`,
          )
          .join("\n")
      : "Nenhuma sessão concluída ainda.";

  const mutableSummary =
    mutableTasks.length > 0
      ? mutableTasks
          .map(
            (t) =>
              `- #${t.order} ${t.title} (${t.scheduledDate} ${t.startTime}, ${t.durationMinutes} min)`,
          )
          .join("\n")
      : "Nenhuma sessão futura restante.";

  // Estágio 1: Triagem com models.fast
  const { output: triage } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: ReplanTriageSchema,
      name: "ReplanTriage",
      description:
        "Classifica a estratégia de replan e identifica se falta escolher novos horários no schedule_picker.",
    }),
    system: `${BASE_SYSTEM_PROMPT}
Você é o agente de triagem de Replan do Glint.
Analise a conversa com o aluno e classifique o pedido de mudança:
- "SCHEDULE_ONLY": o aluno quer mudar APENAS dias/horários (com duração parecida ±15min) sem mudar conteúdo, ritmo ou objetivo.
- "PARTIAL_REPLAN": o aluno quer mudar duração das sessões, dificuldade, ritmo, cortar/adicionar tópicos ou focar mais em prática/teoria.
- "GOAL_PIVOT": o aluno mudou o objetivo final ou os critérios de sucesso do plano.
Defina "needsSchedulePicker: true" SOMENTE se o aluno mencionou querer alterar dias/horários/duração na agenda E ainda não selecionou os novos horários (${hasProvidedSlots ? "JÁ SELECIONOU NOVOS HORÁRIOS — defina needsSchedulePicker como false" : "ainda não selecionou"}).`,
    prompt: `Plano atual: "${planTitle}"
Rotina atual: ${currentSlots.map((s) => `${DAY_NAME_PT[s.dayOfWeek.toLowerCase()] ?? s.dayOfWeek} ${s.startTime} (${s.maxMinutes}m)`).join(", ")}
Sessões já concluídas (imutáveis):
${frozenSummary}

Sessões futuras atuais:
${mutableSummary}

Conversa de replan até agora:
${conversationText}`,
  });

  // Se precisa do schedule_picker e ainda não preencheu, retorna direto sem gastar Jev
  if (triage.needsSchedulePicker && !hasProvidedSlots) {
    return {
      done: false,
      question: {
        id: `replan-schedule-${userTurns}`,
        question: "Quais dias e horários funcionam melhor para você agora?",
        helperText:
          "Selecione sua nova rotina semanal. Horários de outros planos ativos aparecem marcados para evitar conflitos.",
        inputType: "schedule_picker",
        defaultDurationMinutes: currentSlots[0]?.maxMinutes ?? 45,
        occupiedSlots,
      },
    };
  }

  // Avaliação com Jev Judge (se ainda não atingiu o teto de turnos)
  let readyToCompile = userTurns >= MAX_REPLAN_TURNS;
  if (!readyToCompile) {
    if (triage.strategy === "SCHEDULE_ONLY" && hasProvidedSlots) {
      readyToCompile = true;
    } else {
      const jev = await checkWithJev({
        state: {
          planTitle,
          strategy: triage.strategy,
          intentSummary: triage.intentSummary,
          conversation: conversationText,
        },
        instructions:
          "Com o que o aluno já respondeu na conversa, temos clareza suficiente e sem ambiguidade para refatorar as próximas sessões do plano (ritmo, tópicos, duração ou objetivo) sem precisar adivinhar?",
        threshold: JEV_REPLAN_THRESHOLD,
      });
      readyToCompile = jev.approved;
    }
  }

  // Se ainda falta contexto, gera 1 pergunta estruturada curta com models.fast
  if (!readyToCompile) {
    const { output: nextQ } = await generateText({
      model: models.fast,
      output: Output.object({
        schema: ReplanQuestionSchema,
        name: "ReplanFollowUpQuestion",
        description:
          "Próxima pergunta curta e estruturada para esclarecer o pedido de replan do aluno.",
      }),
      system: `${BASE_SYSTEM_PROMPT}
Faça UMA única pergunta curta e objetiva para fechar a lacuna do pedido de replan.
Prefira "single_choice" ou "multi_choice" com 3 a 4 opções claras (com allowCustom: true) sempre que possível, para o aluno responder em 1 clique.`,
      prompt: `Plano: "${planTitle}"
Resumo da intenção até agora: ${triage.intentSummary}
Lacuna detectada: ${triage.missingInfoHint ?? "Detalhar a preferência do aluno para aplicar a mudança com precisão."}
Conversa:\n${conversationText}`,
    });

    return {
      done: false,
      question: {
        id: `replan-q-${userTurns}`,
        question: nextQ.question,
        helperText: nextQ.helperText ?? undefined,
        inputType: nextQ.inputType,
        placeholder: nextQ.placeholder ?? undefined,
        options: nextQ.options
          ? nextQ.options.map((o) => ({
              id: o.id,
              label: o.label,
              description: o.description ?? undefined,
            }))
          : undefined,
        allowCustom: nextQ.allowCustom ?? undefined,
      },
    };
  }

  // Estágio 2: Compilação do Preview
  const weeklyHours = Number(
    (
      effectiveSlots.reduce((acc, s) => acc + s.maxMinutes, 0) / 60
    ).toFixed(1),
  );

  // Caso A: SCHEDULE_ONLY -> Reflow determinístico puro em TypeScript (preserva content READY)
  if (triage.strategy === "SCHEDULE_ONLY") {
    const reflowed = reflowTasksToNewSlots(
      mutableTasks,
      effectiveSlots,
      todayIso,
      timezone,
      nextOrderStart,
    );

    const totalWeeks = Math.max(
      1,
      Math.ceil((frozenTasks.length + reflowed.length) / Math.max(1, effectiveSlots.length)),
    );

    return {
      done: true,
      preview: {
        strategy: "SCHEDULE_ONLY",
        reasonSummary: triage.intentSummary,
        summaryOfChanges: [
          `Nova rotina semanal definida (${weeklyHours}h/semana em ${effectiveSlots.length} ${effectiveSlots.length === 1 ? "horário" : "horários"})`,
          `${reflowed.length} ${reflowed.length === 1 ? "sessão futura reagendada" : "sessões futuras reagendadas"} preservando o conteúdo já preparado`,
        ],
        keptCompletedCount: frozenTasks.length,
        objective: {
          rawInput,
          clearGoal: currentObjective?.clearGoal ?? planTitle,
          successCriteria: currentObjective?.successCriteria ?? [],
        },
        routineContract: {
          timezone,
          totalWeeks,
          weeklyHours,
          slots: effectiveSlots,
        },
        newFutureTasks: reflowed,
      },
    };
  }

  // Caso B: PARTIAL_REPLAN ou GOAL_PIVOT -> models.architect gera apenas newFutureTasks
  const occupiedSection = occupiedSlots.length
    ? `\nHorários ocupados por outros planos ativos (NÃO alocar nesses intervalos):\n${occupiedSlots
        .map((s) => `- ${s.dayOfWeek} ${s.startTime} (${s.durationMinutes} min)`)
        .join("\n")}`
    : "";

  const { output: compiled } = await generateText({
    model: models.architect,
    output: Output.object({
      schema: ReplanCompileOutputSchema,
      name: "ReplanCompiledFutureTasks",
      description:
        "Novas sessões futuras do plano após o replan, preservando integralmente o histórico já concluído.",
    }),
    system: `${BASE_SYSTEM_PROMPT}
Você está compilando um Replan (${triage.strategy}) para um plano ativo do Glint.
Regras obrigatórias:
1. NUNCA repita nem reescreva as sessões já concluídas (frozenTasks). Gere APENAS as novas sessões futuras (newFutureTasks).
2. Data de referência (hoje): ${todayIso} (timezone ${timezone}). Use datas reais futuras YYYY-MM-DD alinhadas exatamente aos slots da rotina abaixo.
3. Cada sessão deve respeitar durationMinutes = consumeMinutes + practiceMinutes do slot daquele dia.
4. Gere entre 4 e 10 sessões futuras focadas e progressivas.
5. Em "summaryOfChanges", escreva 2 a 3 frases curtas e diretas (sem pontos de exclamação) resumindo o que mudou para o preview de confirmação.`,
    prompt: `Objetivo atual: "${currentObjective?.clearGoal ?? planTitle}"
Critérios atuais: ${(currentObjective?.successCriteria ?? []).join(" | ")}
Estratégia: ${triage.strategy}
Pedido consolidado do aluno: ${triage.intentSummary}

Slots da rotina para as próximas sessões:
${effectiveSlots.map((s) => `- ${s.dayOfWeek} às ${s.startTime} (${s.maxMinutes} min)`).join("\n")}${occupiedSection}

Sessões já concluídas (NÃO repetir):
${frozenSummary}

Sessões futuras anteriores (substituir/adaptar conforme pedido):
${mutableSummary}

Conversa completa:
${conversationText}`,
  });

  const newFutureTasks: ReplanPreviewTask[] = compiled.newFutureTasks.map(
    (t, idx) => {
      const order = nextOrderStart + idx;
      const totalMin = t.consumeMinutes + t.practiceMinutes;
      return {
        taskKey: `task_${String(order).padStart(2, "0")}`,
        order,
        title: t.title,
        whyItMatters: t.whyItMatters,
        taskType: t.taskType,
        requiredTools: t.requiredTools,
        searchQueryUsed: t.searchQueryUsed,
        scheduledDate: t.scheduledDate,
        dayOfWeek: t.dayOfWeek.toLowerCase(),
        startTime: t.startTime,
        durationMinutes: totalMin > 0 ? totalMin : t.durationMinutes,
        consumeMinutes: t.consumeMinutes,
        practiceMinutes: t.practiceMinutes,
        preserveContent: false,
      };
    },
  );

  const totalWeeks = Math.max(
    1,
    Math.ceil(
      (frozenTasks.length + newFutureTasks.length) /
        Math.max(1, effectiveSlots.length),
    ),
  );

  return {
    done: true,
    preview: {
      strategy: triage.strategy,
      reasonSummary: compiled.reasonSummary,
      summaryOfChanges: compiled.summaryOfChanges,
      keptCompletedCount: frozenTasks.length,
      objective: {
        rawInput,
        clearGoal:
          triage.strategy === "GOAL_PIVOT" && compiled.updatedClearGoal
            ? compiled.updatedClearGoal
            : (currentObjective?.clearGoal ?? planTitle),
        successCriteria:
          triage.strategy === "GOAL_PIVOT" &&
          compiled.updatedSuccessCriteria &&
          compiled.updatedSuccessCriteria.length > 0
            ? compiled.updatedSuccessCriteria
            : (currentObjective?.successCriteria ?? []),
      },
      routineContract: {
        timezone,
        totalWeeks,
        weeklyHours,
        slots: effectiveSlots,
      },
      newFutureTasks,
    },
  };
}
