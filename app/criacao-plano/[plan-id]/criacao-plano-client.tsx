"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRotateRight,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Lock,
  Xmark,
} from "@gravity-ui/icons";
import type { PlanStage } from "@prisma/client";
import { getLoaderPhrases } from "@/app/api/plan/random-loaders";
import { AnimatedLogo } from "@/app/components/animated-logo";
import { HoneycombLoader } from "@/app/components/honeycomb-loader";
import { MascotBee } from "@/app/components/mascot-bee";
import { QuestionRenderer } from "@/app/components/ai/question-renderer";
import { StepFlightTrail } from "@/app/components/ai/step-flight-trail";
import type {
  QuestionAnswer,
  QuestionPayload,
  StepProgress,
} from "@/app/components/ai/types";
import {
  formatAnswerToText,
  type PlanStructure,
} from "@/lib/agents/types";

interface CriacaoPlanoClientProps {
  plan: {
    id: string;
    stage: PlanStage;
    rawInput: string;
    refinedGoal: string | null;
  };
}

interface PlanApiResponse {
  question?: QuestionPayload;
  stage?: PlanStage;
  refinedGoal?: string | null;
  stepProgress?: StepProgress | null;
  planStructure?: PlanStructure | null;
  error?: string;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
  sunday: "Dom",
};

const ADJUST_PLAN_QUESTION: QuestionPayload = {
  id: "adjust_plan_feedback",
  question: "O que você gostaria de mudar ou melhorar neste plano?",
  inputType: "single_choice",
  allowCustom: true,
  options: [
    {
      id: "more_practice",
      label: "Deixar as sessões mais práticas",
      description:
        "Menos teoria e mais mão na massa desde as primeiras aulas",
    },
    {
      id: "start_simpler",
      label: "Começar mais do básico",
      description: "Incluir passos mais fundamentais antes de avançar",
    },
    {
      id: "more_advanced",
      label: "Ir para pontos mais avançados",
      description: "Pular o básico e focar direto nos desafios mais complexos",
    },
    {
      id: "change_topics",
      label: "Mudar a ordem ou o foco dos temas",
      description: "Priorizar outros assuntos dentro do meu objetivo",
    },
  ],
};

function formatDateShort(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

export function CriacaoPlanoClient({ plan }: CriacaoPlanoClientProps) {
  const router = useRouter();
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [stage, setStage] = useState<PlanStage>(plan.stage);
  const [refinedGoal, setRefinedGoal] = useState<string | null>(
    plan.refinedGoal,
  );
  const [stepProgress, setStepProgress] = useState<StepProgress | null>(null);
  const [planStructure, setPlanStructure] = useState<PlanStructure | null>(
    null,
  );
  const [isAdjustingPlan, setIsAdjustingPlan] = useState(false);
  const [lastAdjustAnswer, setLastAdjustAnswer] =
    useState<QuestionAnswer | null>(null);
  const [isCriteriaPopupOpen, setIsCriteriaPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingAgent, setAwaitingAgent] = useState(false);

  const requestNextStep = useCallback(
    async (answer?: QuestionAnswer) => {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          ...(answer ? { answer } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível continuar a criação do plano");
      }

      return (await response.json()) as PlanApiResponse;
    },
    [plan.id],
  );

  const runAndChain = useCallback(
    async (answer?: QuestionAnswer): Promise<PlanApiResponse> => {
      const data = await requestNextStep(answer);

      if (data.stage === "GENERATING_TASKS" && !data.planStructure) {
        setStage("GENERATING_TASKS");
        setQuestion(null);
        return requestNextStep();
      }

      return data;
    },
    [requestNextStep],
  );

  const applyApiResponse = useCallback((data: PlanApiResponse) => {
    if (data.stage) {
      setStage(data.stage);
    }
    if (data.refinedGoal !== undefined) {
      setRefinedGoal(data.refinedGoal);
    }
    if (data.stepProgress !== undefined) {
      setStepProgress(data.stepProgress);
    } else if (data.stage === "REFINING_GOAL") {
      setStepProgress(null);
    }

    if (data.planStructure) {
      setPlanStructure(data.planStructure);
      setQuestion(null);
      setAwaitingAgent(false);
      return;
    }

    if (data.question) {
      setQuestion(data.question);
      setAwaitingAgent(false);
    } else {
      setQuestion(null);
      setAwaitingAgent(true);
    }
  }, []);

  const loadInitialStep = useCallback(async () => {
    setError(null);
    setAwaitingAgent(false);
    setIsLoading(true);

    try {
      const data = await runAndChain();
      applyApiResponse(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao falar com o mentor";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [applyApiResponse, runAndChain]);

  const submitAnswer = useCallback(
    async (answer: QuestionAnswer) => {
      setError(null);
      setAwaitingAgent(false);
      setIsSubmitting(true);

      try {
        const data = await runAndChain(answer);
        applyApiResponse(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erro inesperado ao falar com o mentor";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [applyApiResponse, runAndChain],
  );

  const handleAcceptPlan = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          action: "accept_plan",
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível confirmar seu plano");
      }

      const data = (await response.json()) as { redirectTo?: string };
      router.push(data.redirectTo ?? "/home");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao confirmar seu plano";
      setError(message);
      setIsSubmitting(false);
    }
  }, [plan.id, router]);

  const handleAdjustPlanSubmit = useCallback(
    async (answer: QuestionAnswer) => {
      const feedback = formatAnswerToText(answer, ADJUST_PLAN_QUESTION);
      setError(null);
      setLastAdjustAnswer(answer);
      setIsAdjustingPlan(false);
      setStage("GENERATING_TASKS");
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            action: "adjust_plan",
            feedback,
          }),
        });

        if (!response.ok) {
          throw new Error("Não foi possível ajustar seu plano");
        }

        const data = (await response.json()) as PlanApiResponse;
        setLastAdjustAnswer(null);
        applyApiResponse(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erro inesperado ao ajustar seu plano";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [applyApiResponse, plan.id],
  );

  useEffect(() => {
    let cancelled = false;

    requestNextStep()
      .then(async (firstData) => {
        if (cancelled) return;
        if (
          firstData.stage === "GENERATING_TASKS" &&
          !firstData.planStructure
        ) {
          setStage("GENERATING_TASKS");
          setQuestion(null);
          const secondData = await requestNextStep();
          if (!cancelled) {
            applyApiResponse(secondData);
          }
          return;
        }
        applyApiResponse(firstData);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "Erro inesperado ao falar com o mentor";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyApiResponse, requestNextStep]);

  const renderCriteriaButton = (visibilityClassName: string) => {
    if (!planStructure) return null;

    return (
      <button
        type="button"
        aria-expanded={isCriteriaPopupOpen}
        onClick={() => setIsCriteriaPopupOpen((prev) => !prev)}
        className={`${visibilityClassName} items-center gap-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F5FCF7] border border-[#95E1B0] shadow-[0_2px_0_0_#95E1B0] hover:shadow-[0_3px_0_0_#82D9A1] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-none px-3 sm:py-1.5 py-2 font-sans text-xs font-semibold text-[#2D3142] transition-all cursor-pointer shrink-0`}
      >
        <span className="size-4 rounded-full bg-[#95E1B0]/45 flex items-center justify-center">
          <Check className="size-3 text-green-600" />
        </span>
        <span className="text-[#2D3142]/70">
          {planStructure.objective.successCriteria.length} metas do plano
        </span>
        <ChevronDown
          className={`size-3.5 text-[#646B82] transition-transform duration-200 ${
            isCriteriaPopupOpen ? "rotate-180" : ""
          }`}
        />
      </button>
    );
  };

  const header = (
    <header className="w-full max-w-[1040px] mx-auto flex items-center justify-between gap-3">
      <AnimatedLogo className="hidden sm:block h-11 w-auto shrink-0" />

      {question && stepProgress && stepProgress.totalSteps > 0 && (
        <StepFlightTrail stepProgress={stepProgress} />
      )}

      <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
        {planStructure &&
          !isAdjustingPlan &&
          !question &&
          !isLoading &&
          !isSubmitting &&
          renderCriteriaButton("inline-flex sm:hidden")}

        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-sans text-xs font-medium text-[#646B82] hover:text-[#2D3142] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
        >
          <span>Pular por enquanto</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </header>
  );

  if (isLoading || isSubmitting) {
    return (
      <>
        {header}
        <div className="my-auto py-12 w-full max-w-2xl mx-auto flex justify-center">
          <HoneycombLoader phrases={getLoaderPhrases(stage)} />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <div className="my-auto py-12 w-full max-w-md mx-auto text-center">
          <MascotBee pose="curious" glasses className="w-20 h-20 mx-auto" />
          <p className="font-display text-xl font-medium text-[#2D3142]">
            Algo saiu do ritmo por aqui
          </p>
          <p className="font-sans text-sm text-[#646B82] mb-4 mt-1">{error}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              onPress={() => {
                if (lastAdjustAnswer) {
                  void handleAdjustPlanSubmit(lastAdjustAnswer);
                  return;
                }
                void loadInitialStep();
              }}
              className="h-11 px-5 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] font-sans text-[#FFFFFF] font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowRotateRight className="size-4" />
              <span>Tentar novamente</span>
            </Button>
            {planStructure && (
              <Button
                type="button"
                onPress={() => {
                  setError(null);
                  setLastAdjustAnswer(null);
                }}
                className="h-11 px-5 rounded-xl bg-[#F3EFE6] hover:bg-[#e8e2d5] font-sans text-[#2D3142] font-semibold text-sm transition-colors inline-flex items-center justify-center cursor-pointer"
              >
                Voltar para o plano
              </Button>
            )}
          </div>
        </div>
      </>
    );
  }

  if (question) {
    return (
      <>
        {header}
        <div className="mt-2 sm:my-auto py-2 sm:py-8 w-full max-w-2xl mx-auto space-y-6">
          <div key={question.id} className="animate-question-enter">
            <QuestionRenderer
              question={question}
              isSubmitting={isSubmitting}
              onSubmit={(answer) => void submitAnswer(answer)}
            />
          </div>
        </div>
      </>
    );
  }

  if (isAdjustingPlan) {
    return (
      <>
        {header}
        <div className="mt-6 sm:my-auto py-2 sm:py-8 w-full max-w-2xl mx-auto space-y-3 sm:space-y-5 animate-question-enter">
          <QuestionRenderer
            question={ADJUST_PLAN_QUESTION}
            isSubmitting={isSubmitting}
            secondaryAction={
              <Button
                type="button"
                isDisabled={isSubmitting}
                onPress={() => setIsAdjustingPlan(false)}
                className="h-9 px-4 rounded-lg bg-[#F3EFE6] hover:bg-[#e8e2d5] font-sans text-[#2D3142]/80 font-semibold text-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <ArrowLeft className="size-3.5" />
                <span>Voltar para o plano</span>
              </Button>
            }
            onSubmit={(answer) => void handleAdjustPlanSubmit(answer)}
          />
        </div>
      </>
    );
  }

  if (planStructure) {
    const visibleTasks = planStructure.tasks.slice(0, 3);
    const hiddenTasks = planStructure.tasks.slice(3);
    const previewHiddenTasks = hiddenTasks.slice(0, 2);

    const renderTaskItem = (task: (typeof planStructure.tasks)[number]) => {
      const isLocked = task.lockState.isLocked;
      const dayLabel =
        DAY_LABELS[task.schedule.dayOfWeek] ?? task.schedule.dayOfWeek;

      return (
        <li
          key={task.taskId}
          className={`rounded-2xl border p-4 transition-colors ${
            isLocked
              ? "bg-[#F3EFE6]/55 border-[#2D3142]/8"
              : "bg-[#FFFFFF] border-[#5B8DEF]"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 size-7 rounded-lg flex items-center justify-center shrink-0 font-sans text-xs font-semibold tabular-nums ${
                isLocked
                  ? "bg-[#F3EFE6] text-[#646B82]"
                  : "bg-[#5B8DEF] text-[#FFFFFF]"
              }`}
            >
              {isLocked ? <Lock className="size-3.5" /> : task.order}
            </span>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-sans text-sm font-semibold text-[#2D3142]">
                  {task.title}
                </p>
                <span className="font-sans text-xs font-medium text-[#646B82] tabular-nums">
                  {dayLabel} {formatDateShort(task.schedule.date)} ·{" "}
                  {task.schedule.startTime}
                </span>
              </div>

              <p className="font-sans text-xs leading-relaxed text-[#646B82]">
                {task.whyItMatters}
              </p>

              <p className="font-sans text-xs text-[#646B82] tabular-nums pt-1">
                {task.schedule.timeBreakdown.consumeMinutes} min estudo +{" "}
                {task.schedule.timeBreakdown.practiceMinutes} min prática
              </p>
            </div>
          </div>
        </li>
      );
    };

    return (
      <>
        {header}
        <div className="mt-6 sm:my-auto py-2 sm:py-8 w-full max-w-2xl mx-auto space-y-3 sm:space-y-5 animate-question-enter">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8F0FE] px-3 py-1.5 font-sans text-xs font-medium text-[#5B8DEF] tabular-nums">
                <Calendar className="size-3.5" />
                <span className="font-semibold">
                  {planStructure.routineContract.totalWeeks}{" "}
                  {planStructure.routineContract.totalWeeks === 1
                    ? "semana"
                    : "semanas"}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFF0E5] px-3 py-1.5 font-sans text-xs font-medium text-[#2D3142]/60 tabular-nums">
                <Clock className="size-3.5 text-[#FF9B85]" />
                <span className="font-semibold">
                  {planStructure.routineContract.weeklyHours}h por semana
                </span>
              </span>
            </div>
            {renderCriteriaButton("hidden sm:inline-flex")}
          </div>

          <header className="flex flex-col sm:flex-row items-start sm:items-center gap-0 sm:gap-3">
            <MascotBee
              pose="standard"
              lookAtUser
              className="w-20 h-16 sm:w-20 sm:h-20 shrink-0 -ml-2 -mb-1 sm:ml-0 sm:mb-0"
            />
            <div className="space-y-1 max-w-[65ch]">
              <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#2D3142]">
                Seu plano está pronto
              </h1>
              <p className="font-sans text-sm leading-relaxed text-[#646B82]">
                {planStructure.objective.clearGoal}
              </p>
            </div>
          </header>

        <div className="flex flex-row items-center gap-2.5 sm:gap-3 pt-1">
          <Button
            type="button"
            isDisabled={isSubmitting}
            onPress={() => setIsAdjustingPlan(true)}
            className="flex-1 sm:flex-initial h-11 px-4 sm:px-5 rounded-xl bg-[#F3EFE6] hover:bg-[#e8e2d5] font-sans text-[#2D3142] font-semibold text-xs sm:text-sm transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            Recusar e ajustar
          </Button>

          <Button
            type="button"
            isDisabled={isSubmitting}
            onPress={() => void handleAcceptPlan()}
            className="flex-1 sm:flex-initial h-11 px-4 sm:px-6 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] font-sans text-[#FFFFFF] font-semibold text-xs sm:text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Aceitar plano</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-medium text-[#2D3142]">
            Sessões da sua jornada
          </h2>

          <ol className="space-y-2.5">{visibleTasks.map(renderTaskItem)}</ol>

          {hiddenTasks.length > 0 && (
            <div className="relative mt-2.5 overflow-hidden rounded-2xl">
              <ol
                aria-hidden="true"
                className="space-y-2.5 select-none pointer-events-none blur-[2px] opacity-60"
              >
                {previewHiddenTasks.map(renderTaskItem)}
              </ol>

              <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF8]/20 via-[#FFFDF8]/88 to-[#FFFDF8] flex flex-col items-center justify-end pb-4 pt-10 px-4 text-center">
                <span className="size-10 rounded-2xl bg-[#FFF0E5] border border-[#FF9B85]/30 flex items-center justify-center text-[#FF9B85] mb-2.5">
                  <Lock className="size-4" />
                </span>

                <p className="font-display text-base sm:text-lg font-medium mb-4 text-[#2D3142]">
                  Mais {hiddenTasks.length}{" "}
                  {hiddenTasks.length === 1
                    ? "sessão planejada"
                    : "sessões planejadas"}{" "}
                  na sua jornada
                </p>

                <Button
                  type="button"
                  className="h-10 px-5 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] font-sans text-[#FFFFFF] font-semibold text-xs sm:text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="size-3.5" />
                  <span>Desbloquear plano completo</span>
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {isCriteriaPopupOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#2D3142]/15 backdrop-blur-[1px]"
            onClick={() => setIsCriteriaPopupOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-label="Metas do plano"
            className="fixed top-20 left-4 right-4 sm:left-auto sm:top-20 sm:right-8 sm:w-96 z-50 rounded-2xl bg-[#FFFFFF] border-2 border-[#5B8DEF]/30 shadow-lg p-5 space-y-3 max-h-[75vh] overflow-y-auto animate-question-enter"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm font-medium text-[#2D3142]">
                O que você vai conquistar
              </h2>
              <button
                type="button"
                aria-label="Fechar metas do plano"
                onClick={() => setIsCriteriaPopupOpen(false)}
                className="p-1 rounded-lg text-[#646B82] hover:text-[#2D3142] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
              >
                <Xmark className="size-4" />
              </button>
            </div>

            <ul className="space-y-2.5">
              {planStructure.objective.successCriteria.map((criterion) => (
                <li
                  key={criterion}
                  className="flex items-start gap-2.5 font-sans font-medium text-xs leading-relaxed text-[#2D3142]/80"
                >
                  <span className="mt-0.5 size-5 rounded-full bg-[#95E1B0]/35 flex items-center justify-center shrink-0">
                    <Check className="size-3.5 text-[#2D3142]" />
                  </span>
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </aside>
        </>
      )}
      </>
    );
  }

  if (awaitingAgent) {
    return (
      <>
        {header}
        <div className="my-auto py-12 w-full max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center">
            <MascotBee
              pose="curious"
              glasses
              lookAtUser
              className="w-20 h-20 shrink-0"
            />
            <div>
              <h1 className="font-display text-2xl font-medium text-[#2D3142]">
                Objetivo definido
              </h1>
            </div>
          </div>

          <div className="rounded-2xl bg-[#FFFFFF] border border-[#2D3142]/10 p-5 space-y-2">
            <p className="font-sans text-xs font-medium text-[#646B82]">
              Seu objetivo
            </p>
            <p className="font-sans text-sm leading-relaxed text-[#2D3142]">
              {refinedGoal ?? plan.rawInput}
            </p>
          </div>
        </div>
      </>
    );
  }

  return header;
}
