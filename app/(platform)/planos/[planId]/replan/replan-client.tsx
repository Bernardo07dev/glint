"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRotateLeft,
  Calendar,
  Check,
  CircleCheck,
  Clock,
  Xmark,
} from "@gravity-ui/icons";
import { AnimatedLogo } from "@/app/components/animated-logo";
import { HoneycombLoader } from "@/app/components/honeycomb-loader";
import { QuestionRenderer } from "@/app/components/ai/question-renderer";
import type {
  QuestionAnswer,
  QuestionPayload,
  ScheduleSlot,
} from "@/app/components/ai/types";
import type {
  ReplanMessage,
  ReplanPreview,
  ReplanTurnResult,
} from "@/lib/agents/replan";
import {
  DAY_NAME_PT,
  formatWeekdayAndDatePt,
} from "@/lib/plan/plan-structure";

const INITIAL_REPLAN_QUESTION: QuestionPayload = {
  id: "replan_initial",
  question: "O que você quer mudar no seu plano?",
  inputType: "single_choice",
  allowCustom: true,
  options: [
    {
      id: "schedule",
      label: "Mudar dias e horários",
      description: "Reorganizar minha rotina semanal mantendo o conteúdo",
    },
    {
      id: "difficulty",
      label: "Está muito fácil ou difícil",
      description: "Ajustar ritmo, profundidade ou duração das sessões",
    },
    {
      id: "focus",
      label: "Mudar o foco do conteúdo",
      description: "Mais prática, menos teoria ou priorizar outros temas",
    },
    {
      id: "goal",
      label: "Mudar o objetivo final",
      description: "Redirecionar o plano preservando o que já concluí",
    },
  ],
};

const REFINE_MORE_QUESTION: QuestionPayload = {
  id: "replan_refine_more",
  question: "O que mais você gostaria de ajustar?",
  inputType: "text",
  placeholder:
    "Ex.: Quero sessões de 30 minutos nas terças e mais exercícios práticos...",
};

const REPLAN_LOADER_PHRASES = [
  "Avaliando o que você já concluiu...",
  "Recalibrando suas próximas sessões...",
  "Conferindo seus horários livres...",
  "Organizando o novo ritmo do plano...",
] as const;

const STRATEGY_LABEL: Record<ReplanPreview["strategy"], string> = {
  SCHEDULE_ONLY: "Reagendamento de rotina",
  PARTIAL_REPLAN: "Ajuste de ritmo e trilha",
  GOAL_PIVOT: "Novo objetivo do plano",
};

interface ReplanClientProps {
  planId: string;
  planTitle: string;
}

function formatAnswerAsText(
  answer: QuestionAnswer,
  question: QuestionPayload,
): string {
  if (answer.inputType === "text") {
    return answer.value.trim();
  }
  if (answer.inputType === "single_choice") {
    const label =
      question.options?.find((o) => o.id === answer.value)?.label ??
      answer.value;
    return answer.customText?.trim()
      ? `${label} (${answer.customText.trim()})`
      : label;
  }
  if (answer.inputType === "multi_choice") {
    const labels = answer.values.map(
      (v) => question.options?.find((o) => o.id === v)?.label ?? v,
    );
    const joined = labels.join(", ");
    return answer.customText?.trim()
      ? `${joined} (${answer.customText.trim()})`
      : joined;
  }
  return answer.slots
    .map((s) => `${s.day} ${s.startTime} (${s.durationMinutes} min)`)
    .join(", ");
}

export function ReplanClient({ planId, planTitle }: ReplanClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ReplanMessage[]>([]);
  const [updatedSlots, setUpdatedSlots] = useState<ScheduleSlot[] | undefined>(
    undefined,
  );
  const [currentQuestion, setCurrentQuestion] =
    useState<QuestionPayload | null>(null);
  const [preview, setPreview] = useState<ReplanPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTurn = async (
    nextMessages: ReplanMessage[],
    slotsOverride?: ScheduleSlot[],
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/plan/${encodeURIComponent(planId)}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "turn",
          messages: nextMessages,
          updatedSlots: slotsOverride ?? updatedSlots,
        }),
      });

      const rawText = await res.text();
      const data = rawText
        ? (JSON.parse(rawText) as ReplanTurnResult & { error?: string })
        : ({} as ReplanTurnResult & { error?: string });
      if (!res.ok) {
        throw new Error(
          data.error ?? `Não foi possível analisar o ajuste (HTTP ${res.status}).`,
        );
      }

      setMessages(nextMessages);

      if (data.done) {
        setCurrentQuestion(null);
        setPreview(data.preview);
      } else {
        setPreview(null);
        setCurrentQuestion(data.question);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.question.question },
        ]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível processar seu pedido agora.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const activeQuestion =
    currentQuestion ??
    (messages.length > 0 ? REFINE_MORE_QUESTION : INITIAL_REPLAN_QUESTION);

  const handleQuestionAnswer = (answer: QuestionAnswer) => {
    if (isLoading) return;
    const text = formatAnswerAsText(answer, activeQuestion);
    if (!text) return;

    const nextSlots =
      answer.inputType === "schedule_picker" ? answer.slots : updatedSlots;
    if (answer.inputType === "schedule_picker") {
      setUpdatedSlots(answer.slots);
    }

    const nextMessages: ReplanMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    void sendTurn(nextMessages, nextSlots);
  };

  const handleApply = async () => {
    if (!preview || isApplying) return;
    setIsApplying(true);
    setError(null);

    try {
      const res = await fetch(`/api/plan/${encodeURIComponent(planId)}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "apply",
          preview,
        }),
      });

      const rawText = await res.text();
      const data = rawText
        ? (JSON.parse(rawText) as { success?: boolean; error?: string })
        : {};

      if (!res.ok) {
        throw new Error(
          data.error ??
            `Não foi possível aplicar as mudanças no plano (HTTP ${res.status}).`,
        );
      }

      router.push(`/planos/${planId}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao aplicar mudanças no plano.",
      );
      setIsApplying(false);
    }
  };

  const handleRefineMore = () => {
    setPreview(null);
    setCurrentQuestion(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#FFFDF8] px-4 py-5 sm:px-6 sm:py-8">
      {/* Header idêntico ao fluxo de criação de plano */}
      <header className="mx-auto flex w-full max-w-2xl shrink-0 items-center justify-between gap-4 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <AnimatedLogo className="h-8 w-auto shrink-0" />
          <span className="hidden sm:inline text-[#2D3142]/20">|</span>
          <span className="hidden sm:inline truncate text-xs font-medium text-[#646B82]">
            {planTitle}
          </span>
        </div>

        <Link
          href={`/planos/${planId}`}
          aria-label="Voltar para o plano"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#F3EFE6] px-3 text-xs font-semibold text-[#2D3142]/80 transition-colors hover:bg-[#EAE4D7] cursor-pointer shrink-0"
        >
          <Xmark className="size-4" />
          <span className="hidden sm:inline">Sair</span>
        </Link>
      </header>

      {/* Conteúdo centralizado em tela cheia */}
      <div className="my-auto mx-auto w-full max-w-2xl py-4 sm:py-8 space-y-6">
        {error && (
          <div className="rounded-2xl border border-[#C4553F]/20 bg-[#FFF0E5] px-4 py-3 text-xs font-medium text-[#C4553F]">
            {error}
          </div>
        )}

        {isLoading || isApplying ? (
          <div className="flex min-h-[260px] items-center justify-center py-8">
            <HoneycombLoader
              phrases={
                isApplying
                  ? [
                      "Salvando nova versão do plano...",
                      "Atualizando sua agenda...",
                    ]
                  : REPLAN_LOADER_PHRASES
              }
            />
          </div>
        ) : preview ? (
          /* Preview de Diff em tela cheia */
          <div className="space-y-6 animate-question-enter">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0FE] px-3 py-1 text-xs font-medium text-[#3E6FD6]">
                <Calendar className="size-3.5" />
                <span>{STRATEGY_LABEL[preview.strategy]}</span>
              </span>

              {preview.keptCompletedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#95E1B0]/30 px-3 py-1 text-xs font-medium tabular-nums text-[#2B6E47]">
                  <CircleCheck className="size-3.5" />
                  <span>
                    {preview.keptCompletedCount}{" "}
                    {preview.keptCompletedCount === 1
                      ? "sessão concluída mantida"
                      : "sessões concluídas mantidas"}
                  </span>
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              <h1 className="font-display text-xl sm:text-2xl font-medium text-[#2D3142]">
                Revise o que vai mudar no seu plano
              </h1>
              <ul className="space-y-2">
                {preview.summaryOfChanges.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#2D3142]/85"
                  >
                    <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#95E1B0]/40 text-[#2B6E47]">
                      <Check className="size-2.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 rounded-2xl border border-[#2D3142]/8 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#2D3142]">
                <Clock className="size-3.5 text-[#5B8DEF]" />
                <span>
                  Nova rotina ({preview.routineContract.weeklyHours}h/semana)
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preview.routineContract.slots.map((slot, idx) => (
                  <span
                    key={`${slot.dayOfWeek}-${slot.startTime}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F3EFE6] px-3 py-1 text-xs tabular-nums text-[#2D3142]"
                  >
                    <span className="font-medium">
                      {DAY_NAME_PT[slot.dayOfWeek.toLowerCase()] ??
                        slot.dayOfWeek}
                    </span>
                    <span className="text-[#646B82]">
                      {slot.startTime} · {slot.maxMinutes} min
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold text-[#646B82]">
                Próximas sessões ({preview.newFutureTasks.length})
              </h2>
              <ol className="space-y-2">
                {preview.newFutureTasks.map((task) => (
                  <li
                    key={task.taskKey}
                    className="rounded-2xl border border-[#2D3142]/8 bg-white px-4 py-3 space-y-1"
                  >
                    <p className="text-[11px] font-medium tabular-nums text-[#646B82]">
                      Sessão {task.order} ·{" "}
                      {formatWeekdayAndDatePt(task.scheduledDate)} às{" "}
                      {task.startTime} · {task.durationMinutes} min
                    </p>
                    <p className="font-display text-sm font-medium text-[#2D3142]">
                      {task.title}
                    </p>
                    <p className="text-xs leading-relaxed text-[#646B82]">
                      {task.whyItMatters}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleRefineMore}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F3EFE6] px-4 py-2.5 text-[13px] font-semibold text-[#2D3142]/80 transition-colors hover:bg-[#EAE4D7] cursor-pointer"
              >
                <ArrowRotateLeft className="size-4" />
                <span>Ajustar mais algo</span>
              </button>
              <button
                type="button"
                onClick={() => void handleApply()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF9B85] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#f28972] cursor-pointer"
              >
                <CircleCheck className="size-4" />
                <span>Aplicar mudanças</span>
              </button>
            </div>
          </div>
        ) : (
          /* Perguntas em tela cheia direto sobre #FFFDF8 via QuestionRenderer */
          <div key={activeQuestion.id} className="animate-question-enter">
            <QuestionRenderer
              question={activeQuestion}
              isSubmitting={isLoading}
              onSubmit={handleQuestionAnswer}
            />
          </div>
        )}
      </div>
    </div>
  );
}
