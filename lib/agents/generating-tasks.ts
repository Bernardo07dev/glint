import { generateText, Output } from "ai";
import { models } from "@/lib/infra/llm";
import type { OccupiedSlot } from "@/lib/schedule/occupied-slots";
import { BASE_SYSTEM_PROMPT } from "./prompts";
import {
  GeneratingTasksOutputSchema,
  type ExecutableMeta,
  type PlanStructure,
} from "./types";

export interface RunGeneratingTasksInput {
  planId: string;
  rawInput: string;
  refinedGoal: string;
  executableMeta: ExecutableMeta;
  timezone?: string;
  startDateIso?: string;
  previousPlanStructure?: PlanStructure | null;
  adjustmentFeedback?: string[];
  occupiedSlots?: OccupiedSlot[];
}

export async function runGeneratingTasksAgent({
  planId,
  rawInput,
  refinedGoal,
  executableMeta,
  timezone = "America/Sao_Paulo",
  startDateIso,
  previousPlanStructure,
  adjustmentFeedback,
  occupiedSlots,
}: RunGeneratingTasksInput): Promise<PlanStructure> {
  const referenceDate = startDateIso ?? new Date().toISOString().slice(0, 10);

  const collectedSteps = executableMeta.steps
    .map(
      (step) =>
        `- [${step.id}] ${step.questionGoal}: ${step.value ?? "não informado"}`,
    )
    .join("\n");

  const previousSummary = previousPlanStructure?.tasks?.length
    ? `\n\nVersão anterior das sessões:\n${previousPlanStructure.tasks
        .map(
          (t) =>
            `${t.order}. ${t.title} (${t.schedule.durationMinutes} min: ${t.schedule.timeBreakdown.consumeMinutes}m estudo + ${t.schedule.timeBreakdown.practiceMinutes}m prática)`,
        )
        .join("\n")}`
    : "";

  const occupiedSection = occupiedSlots?.length
    ? `\n\nHorários já reservados por outros planos ativos do aluno (NÃO aloque sessões nesses dias/horários nem em intervalos que se sobreponham a eles):\n${occupiedSlots
        .map(
          (slot) =>
            `- ${slot.dayOfWeek} ${slot.startTime} (${slot.durationMinutes} min)`,
        )
        .join("\n")}`
    : "";

  const feedbackSection =
    adjustmentFeedback && adjustmentFeedback.length > 0
      ? `\n\nPedidos de ajuste do aluno sobre a versão anterior do plano:\n${adjustmentFeedback
          .map((item) => `- ${item}`)
          .join("\n")}\nAplique esses ajustes mantendo a rotina real do aluno e a progressão até o objetivo.`
      : "";

  const { output } = await generateText({
    model: models.architect,
    output: Output.object({
      schema: GeneratingTasksOutputSchema,
      name: "PlanStructureSkeleton",
      description:
        "Esqueleto completo do plano de aprendizado com critérios de sucesso, contrato de rotina e lista progressiva de tasks.",
    }),
    system: `${BASE_SYSTEM_PROMPT}

Você está na Etapa 4 (Compilação do Esqueleto do Plano — plan_structure.json).
Com base no objetivo claro e nas respostas coletadas na entrevista, monte a sequência completa e realista de sessões de estudo (tasks).

Regras obrigatórias:
1. Data de referência (hoje): ${referenceDate} (timezone ${timezone}). Use datas reais futuras no formato YYYY-MM-DD alinhadas exatamente com os dias da semana escolhidos pelo aluno no step "routine_and_slots".
2. Cada task deve caber perfeitamente no slot daquele dia: durationMinutes DEVE ser igual a consumeMinutes + practiceMinutes e respeitar o tempo informado pelo aluno.
3. Progressão real: ordene as tasks do nível atual do aluno até o entregável final definido em clearGoal, sem saltos bruscos nem repetição.
4. Para cada task, defina:
   - "title": título claro e acionável da sessão.
   - "whyItMatters": 1 frase explicando por que essa sessão destrava a próxima etapa.
   - "taskType": ex.: "concept_and_setup", "hands_on_practice", "guided_build", "review_and_challenge".
   - "requiredTools": subconjunto adequado dentre ["video", "concept_explainer", "active_recall_quiz"].
   - "searchQueryUsed": termo curto e objetivo para buscar conteúdo/vídeo complementar daquela aula.
5. Defina de 2 a 5 "successCriteria" concretos que comprovem que o aluno atingiu o objetivo ao final.
6. Gere entre 6 e 12 tasks essenciais para manter o plano focado, direto e rápido de consultar.`,
    prompt: `Pedido original: "${rawInput}"
Objetivo claro (clearGoal): "${refinedGoal}"

Dados coletados na entrevista:
${collectedSteps}${occupiedSection}${previousSummary}${feedbackSection}`,
  });

  const tasks = output.tasks.map((task, index) => {
    const order = index + 1;
    const taskNumber = String(order).padStart(2, "0");
    const totalMinutes = task.consumeMinutes + task.practiceMinutes;

    return {
      taskId: `task_${taskNumber}`,
      order,
      title: task.title,
      whyItMatters: task.whyItMatters,
      schedule: {
        date: task.date,
        dayOfWeek: task.dayOfWeek,
        startTime: task.startTime,
        durationMinutes: totalMinutes > 0 ? totalMinutes : task.durationMinutes,
        timeBreakdown: {
          consumeMinutes: task.consumeMinutes,
          practiceMinutes: task.practiceMinutes,
        },
      },
      lockState: {
        isLocked: index > 0,
        unlockAt: `${task.date}T00:00:00-03:00`,
      },
      pedagogy: {
        taskType: task.taskType,
        requiredTools: task.requiredTools,
      },
      backgroundWorker: {
        enrichmentStatus: "queued" as const,
        searchQueryUsed: task.searchQueryUsed,
        jevAlignmentScore: null,
      },
      content: null,
    };
  });

  return {
    planId,
    status: "enriching",
    objective: {
      rawInput,
      clearGoal: refinedGoal,
      successCriteria: output.successCriteria,
    },
    routineContract: {
      timezone,
      totalWeeks: output.routineContract.totalWeeks,
      weeklyHours: output.routineContract.weeklyHours,
      slots: output.routineContract.slots,
    },
    tasks,
  };
}
