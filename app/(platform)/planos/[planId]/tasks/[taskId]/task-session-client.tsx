"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRotateLeft,
  CircleCheck,
  Play,
  Xmark,
} from "@gravity-ui/icons";
import {
  enrichTaskNowAction,
  finishTaskSessionAction,
  flushStepTimeAction,
  getTaskEnrichmentStatusAction,
  recordQuizAnswerAction,
  recordStepProgressAction,
  selectStepAction,
  updateStepChecklistAction,
} from "@/app/actions/session";
import { WaitingFrontTapAnimation } from "@/app/components/animations";
import { MascotBee } from "@/app/components/mascot-bee";
import type { LiveQuizState } from "@/app/(platform)/planos/[planId]/tasks/components/tools/recall-quiz";
import {
  SessionStep,
  type GateNotice,
} from "@/app/(platform)/planos/[planId]/tasks/components/tools/session-step";
import { StepStage } from "@/app/(platform)/planos/[planId]/tasks/components/tools/step-stage";
import type {
  ClientStepProgressItem,
  StepQuizProgress,
} from "@/lib/tasks/step-progress";
import { resolveSteps, type TaskContent } from "@/lib/tasks/task-content";

interface TaskSessionClientProps {
  planId: string;
  planTitle: string;
  taskKey: string;
  title: string;
  whyItMatters: string;
  durationMinutes: number;
  initialEnrichmentStatus: string;
  initialTaskStatus: string;
  initialContent: TaskContent | null;
  initialCompletedSteps: string[];
  initialStepProgress?: ClientStepProgressItem[];
  initialCurrentStepId?: string | null;
  waitingHeadline: string;
}

type DifficultyOption = "too_easy" | "just_right" | "too_hard";

const DIFFICULTY_OPTIONS: Array<{
  value: DifficultyOption;
  label: string;
  hint: string;
}> = [
  { value: "too_easy", label: "Fácil", hint: "Posso avançar mais rápido" },
  { value: "just_right", label: "Na medida", hint: "Ritmo ideal para mim" },
  { value: "too_hard", label: "Desafiador", hint: "Reforçar na próxima sessão" },
];

const INACTIVITY_CAP_MS = 3 * 60 * 1000;
const CHECKLIST_DEBOUNCE_MS = 350;
const ENRICHMENT_POLL_INTERVAL_MS = 3000;

export function TaskSessionClient({
  planId,
  taskKey,
  title,
  durationMinutes,
  initialEnrichmentStatus,
  initialTaskStatus,
  initialContent,
  initialCompletedSteps,
  initialStepProgress = [],
  initialCurrentStepId = null,
  waitingHeadline,
}: TaskSessionClientProps) {
  const router = useRouter();
  const [content, setContent] = useState<TaskContent | null>(initialContent);
  const [enrichmentStatus, setEnrichmentStatus] = useState(
    initialEnrichmentStatus,
  );
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const steps = useMemo(
    () => (content ? resolveSteps(content) : []),
    [content],
  );

  const initialStepIndex = useMemo(() => {
    if (steps.length === 0) return 0;
    if (initialCurrentStepId) {
      const idx = steps.findIndex((s) => s.step.id === initialCurrentStepId);
      if (idx >= 0) return idx;
    }
    const firstUnfinished = steps.findIndex(
      (s) => !initialCompletedSteps.includes(s.step.id),
    );
    return firstUnfinished >= 0 ? firstUnfinished : 0;
  }, [steps, initialCurrentStepId, initialCompletedSteps]);

  const [stepIndex, setStepIndex] = useState(initialStepIndex);
  const [checkedByStep, setCheckedByStep] = useState<Record<string, number[]>>(
    () => {
      const map: Record<string, number[]> = {};
      for (const item of initialStepProgress) {
        map[item.stepId] = Array.isArray(item.checkedItems)
          ? [...item.checkedItems].sort((a, b) => a - b)
          : [];
      }
      return map;
    },
  );
  const [quizProgressByStep, setQuizProgressByStep] = useState<
    Record<string, StepQuizProgress | null>
  >(() => {
    const map: Record<string, StepQuizProgress | null> = {};
    for (const item of initialStepProgress) {
      if (item.quizData) {
        map[item.stepId] = item.quizData;
      }
    }
    return map;
  });

  const [quizState, setQuizState] = useState<LiveQuizState | undefined>(
    undefined,
  );
  const [gateNotice, setGateNotice] = useState<GateNotice | null>(null);
  const [finished, setFinished] = useState(initialTaskStatus === "COMPLETED");

  const [difficulty, setDifficulty] = useState<DifficultyOption>("just_right");
  const [userNotes, setUserNotes] = useState("");
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  // Refs para debounce idempotente do checklist e timer de tempo real por step
  const checklistTimerByStepRef = useRef<Record<string, number>>({});
  const elapsedSecondsRef = useRef<number>(0);
  const lastActivityAtRef = useRef<number>(Date.now());
  const currentStepId = steps[stepIndex]?.step.id ?? null;

  const consumeElapsedSeconds = useCallback(() => {
    const seconds = elapsedSecondsRef.current;
    elapsedSecondsRef.current = 0;
    return seconds;
  }, []);

  // Marca o step inicial como IN_PROGRESS ao abrir a sessão
  useEffect(() => {
    if (!currentStepId || finished) return;
    void selectStepAction({
      planId,
      taskIdentifier: taskKey,
      toStepId: currentStepId,
    });
    // Dispara apenas na abertura inicial do step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(currentStepId)]);

  // Timer confiável: só acumula enquanto a aba estiver visível e houver atividade nos últimos 3 min
  useEffect(() => {
    if (!currentStepId || finished) return;

    const markActivity = () => {
      lastActivityAtRef.current = Date.now();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const delta = consumeElapsedSeconds();
        if (delta > 0) {
          void flushStepTimeAction({
            planId,
            taskIdentifier: taskKey,
            stepId: currentStepId,
            elapsedSeconds: delta,
          });
        }
      } else {
        lastActivityAtRef.current = Date.now();
      }
    };

    const interval = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastActivityAtRef.current <= INACTIVITY_CAP_MS
      ) {
        elapsedSecondsRef.current += 1;
      }
    }, 1000);

    window.addEventListener("mousemove", markActivity, { passive: true });
    window.addEventListener("keydown", markActivity, { passive: true });
    window.addEventListener("scroll", markActivity, {
      passive: true,
      capture: true,
    });
    window.addEventListener("click", markActivity, { passive: true });
    window.addEventListener("touchstart", markActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("mousemove", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("scroll", markActivity, true);
      window.removeEventListener("click", markActivity);
      window.removeEventListener("touchstart", markActivity);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [currentStepId, finished, planId, taskKey, consumeElapsedSeconds]);

  // Limpa timers de debounce ao desmontar
  useEffect(() => {
    const timers = checklistTimerByStepRef.current;
    return () => {
      Object.values(timers).forEach((id) => window.clearTimeout(id));
    };
  }, []);

  // Polling leve quando a sessão já abriu em GENERATING (ex.: usuário saiu e voltou)
  useEffect(() => {
    if (content || isEnriching || enrichmentStatus !== "GENERATING") return;

    let cancelled = false;
    let inFlight = false;

    const poll = async () => {
      if (cancelled || inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        const res = await getTaskEnrichmentStatusAction({
          planId,
          taskIdentifier: taskKey,
        });
        if (cancelled || !res.success) return;

        if (res.enrichmentStatus === "READY" && res.content) {
          setContent(res.content);
          if (res.stepProgress) {
            const nextChecked: Record<string, number[]> = {};
            const nextQuiz: Record<string, StepQuizProgress | null> = {};
            for (const item of res.stepProgress) {
              nextChecked[item.stepId] = item.checkedItems;
              if (item.quizData) nextQuiz[item.stepId] = item.quizData;
            }
            setCheckedByStep(nextChecked);
            setQuizProgressByStep(nextQuiz);
          }
          setEnrichmentStatus("READY");
          setStepIndex(0);
          router.refresh();
          return;
        }

        if (res.enrichmentStatus && res.enrichmentStatus !== "GENERATING") {
          setEnrichmentStatus(res.enrichmentStatus);
          if (res.enrichmentStatus === "FAILED") {
            setEnrichError(
              res.error ?? "Não foi possível preparar sua sessão agora.",
            );
          }
        }
      } finally {
        inFlight = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void poll();
    }, ENRICHMENT_POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void poll();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [content, isEnriching, enrichmentStatus, planId, taskKey, router]);

  const isStepReadyToAdvance = useCallback(
    (idx: number): { ready: boolean; reason?: "checklist" | "quiz"; message?: string } => {
      const target = steps[idx];
      if (!target) return { ready: false };

      const totalChecklist = target.step.walkthrough.length;
      const checkedCount = (checkedByStep[target.step.id] ?? []).length;

      if (totalChecklist > 0 && checkedCount < totalChecklist) {
        const remaining = totalChecklist - checkedCount;
        return {
          ready: false,
          reason: "checklist",
          message:
            remaining === 1
              ? "Falta marcar 1 item do Passo a Passo antes de avançar."
              : `Marque os ${remaining} itens restantes do Passo a Passo antes de avançar.`,
        };
      }

      if (target.step.toolRef === "active_recall_quiz") {
        const qProgress = quizProgressByStep[target.step.id];
        if (!qProgress?.completed) {
          return {
            ready: false,
            reason: "quiz",
            message:
              "Conclua todas as perguntas do quiz de fixação antes de avançar para o próximo passo.",
          };
        }
      }

      return { ready: true };
    },
    [steps, checkedByStep, quizProgressByStep],
  );

  const handleToggleChecklistItem = useCallback(
    (itemIndex: number) => {
      const current = steps[stepIndex];
      if (!current) return;
      const stepId = current.step.id;

      setCheckedByStep((prev) => {
        const set = new Set(prev[stepId] ?? []);
        if (set.has(itemIndex)) set.delete(itemIndex);
        else set.add(itemIndex);
        const nextChecked = Array.from(set).sort((a, b) => a - b);

        if (
          nextChecked.length >= current.step.walkthrough.length &&
          gateNotice?.type === "checklist"
        ) {
          setGateNotice(null);
        }

        // Debounce / Coalescing idempotente: envia sempre o array completo `nextChecked`
        const existingTimer = checklistTimerByStepRef.current[stepId];
        if (existingTimer) {
          window.clearTimeout(existingTimer);
        }
        checklistTimerByStepRef.current[stepId] = window.setTimeout(() => {
          delete checklistTimerByStepRef.current[stepId];
          void updateStepChecklistAction({
            planId,
            taskIdentifier: taskKey,
            stepId,
            checkedItems: nextChecked,
          });
        }, CHECKLIST_DEBOUNCE_MS);

        return { ...prev, [stepId]: nextChecked };
      });
    },
    [steps, stepIndex, gateNotice, planId, taskKey],
  );

  const handleQuizProgressChange = useCallback(
    (progress: StepQuizProgress) => {
      const current = steps[stepIndex];
      if (!current) return;
      const stepId = current.step.id;

      setQuizProgressByStep((prev) => ({
        ...prev,
        [stepId]: progress,
      }));

      if (progress.completed && gateNotice?.type === "quiz") {
        setGateNotice(null);
      }

      void recordQuizAnswerAction({
        planId,
        taskIdentifier: taskKey,
        stepId,
        quizProgress: progress,
      });
    },
    [steps, stepIndex, gateNotice, planId, taskKey],
  );

  const handleSelectStep = useCallback(
    (targetIndex: number) => {
      if (targetIndex === stepIndex || targetIndex < 0 || targetIndex >= steps.length) {
        return;
      }

      // Gate de Progressão na StepTrail: permite voltar livremente, mas bloqueia pular para frente se houver passo pendente
      if (targetIndex > stepIndex) {
        for (let idx = stepIndex; idx < targetIndex; idx++) {
          const check = isStepReadyToAdvance(idx);
          if (!check.ready && check.reason && check.message) {
            if (idx !== stepIndex) {
              setStepIndex(idx);
            }
            setGateNotice({
              type: check.reason,
              message: check.message,
              key: Date.now(),
            });
            return;
          }
        }
      }

      const fromStep = steps[stepIndex];
      const toStep = steps[targetIndex];
      const elapsed = consumeElapsedSeconds();

      setGateNotice(null);
      setStepIndex(targetIndex);

      if (toStep) {
        void selectStepAction({
          planId,
          taskIdentifier: taskKey,
          fromStepId: fromStep?.step.id,
          toStepId: toStep.step.id,
          elapsedSecondsOnPreviousStep: elapsed,
        });
      }
    },
    [stepIndex, steps, isStepReadyToAdvance, consumeElapsedSeconds, planId, taskKey],
  );

  const handlePrepareNow = async () => {
    setIsEnriching(true);
    setEnrichError(null);
    setEnrichmentStatus("GENERATING");

    const res = await enrichTaskNowAction({
      planId,
      taskIdentifier: taskKey,
    });

    setIsEnriching(false);

    if (res.success && res.content) {
      setContent(res.content);
      if (res.stepProgress) {
        const nextChecked: Record<string, number[]> = {};
        const nextQuiz: Record<string, StepQuizProgress | null> = {};
        for (const item of res.stepProgress) {
          nextChecked[item.stepId] = item.checkedItems;
          if (item.quizData) nextQuiz[item.stepId] = item.quizData;
        }
        setCheckedByStep(nextChecked);
        setQuizProgressByStep(nextQuiz);
      }
      setEnrichmentStatus("READY");
      setStepIndex(0);
      router.refresh();
      return;
    }

    setEnrichmentStatus(res.enrichmentStatus ?? "FAILED");
    setEnrichError(
      res.error ?? "Não foi possível preparar sua sessão agora.",
    );
  };

  const handleNextStep = () => {
    const current = steps[stepIndex];
    if (!current) return;

    const gate = isStepReadyToAdvance(stepIndex);
    if (!gate.ready && gate.reason && gate.message) {
      setGateNotice({
        type: gate.reason,
        message: gate.message,
        key: Date.now(),
      });
      return;
    }

    const pendingTimer = checklistTimerByStepRef.current[current.step.id];
    if (pendingTimer) {
      window.clearTimeout(pendingTimer);
      delete checklistTimerByStepRef.current[current.step.id];
    }

    const nextStep = steps[stepIndex + 1];
    const elapsed = consumeElapsedSeconds();
    const currentChecked = checkedByStep[current.step.id] ?? [];
    const currentQuiz = quizProgressByStep[current.step.id] ?? null;

    void recordStepProgressAction({
      planId,
      taskIdentifier: taskKey,
      stepId: current.step.id,
      nextStepId: nextStep?.step.id,
      elapsedSeconds: elapsed,
      checkedItems: currentChecked,
      quizProgress: currentQuiz,
    });

    setGateNotice(null);

    if (stepIndex + 1 < steps.length) {
      setStepIndex(stepIndex + 1);
    } else {
      setFinished(true);
    }
  };

  const handleFinishSession = () => {
    setSaveError(null);
    startSaving(async () => {
      const res = await finishTaskSessionAction({
        planId,
        taskIdentifier: taskKey,
        difficultyRating: difficulty,
        userNotes,
      });

      if (!res.success) {
        setSaveError(res.error ?? "Não foi possível salvar a conclusão.");
        return;
      }

      router.push(`/planos/${planId}`);
      router.refresh();
    });
  };

  const resolved = steps[stepIndex];
  const currentGate = isStepReadyToAdvance(stepIndex);

  /* Estado 3: Sessão Ativa — Workspace estilo LeetCode ocupando 100% da tela */
  if (content && resolved && !finished) {
    return (
      <SessionStep
        planId={planId}
        taskKey={taskKey}
        taskTitle={title}
        step={resolved.step}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        checkedIndices={checkedByStep[resolved.step.id] ?? []}
        onToggleChecklistItem={handleToggleChecklistItem}
        gateNotice={gateNotice}
        quizState={quizState}
        onSelectStep={handleSelectStep}
        onBack={
          stepIndex > 0 ? () => handleSelectStep(stepIndex - 1) : undefined
        }
        onNext={handleNextStep}
        nextLabel={
          stepIndex + 1 < steps.length
            ? "Próximo passo"
            : "Concluir sessão"
        }
        nextPrimary={currentGate.ready}
      >
        <StepStage
          resolved={resolved}
          initialQuizProgress={quizProgressByStep[resolved.step.id] ?? null}
          onQuizStateChange={setQuizState}
          onQuizProgressChange={handleQuizProgressChange}
        />
      </SessionStep>
    );
  }

  /* Estado 1B: Enriquecimento em andamento (Polling + Abelhinha batendo o pé + Voltar) */
  if ((!content || !resolved) && (isEnriching || enrichmentStatus === "GENERATING")) {
    return (
      <div className="fixed inset-0 z-50">
        <WaitingFrontTapAnimation
          headline={waitingHeadline}
          backHref={`/planos/${planId}`}
          backLabel="Voltar para planos"
        />
      </div>
    );
  }

  /* Estados 1 e 2: Preparação sob demanda ou Fechamento da Sessão */
  return (
    <main className="min-h-dvh bg-[#FFFDF8]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <Link
              href={`/planos/${planId}`}
              className="inline-flex mb-2 items-center gap-1.5 text-xs font-medium text-[#646B82] hover:text-[#2D3142] cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span className="truncate max-w-[46ch]">Voltar para planos</span>
            </Link>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#2D3142]">
              {title}
            </h1>
          </div>

          <Link
            href={`/planos/${planId}`}
            aria-label="Sair da sessão"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F3EFE6] text-[#646B82] transition-colors hover:bg-[#eae4d7] cursor-pointer"
          >
            <Xmark className="size-4" />
          </Link>
        </header>

        {!content || !resolved ? (
          <section className="flex flex-col items-center gap-6 rounded-3xl border border-[#5B8DEF]/20 bg-white px-6 py-10 text-center sm:px-10">
            <>
              <MascotBee
                  pose={enrichmentStatus === "FAILED" ? "curious" : "focus"}
                  className="h-24 w-28"
                />
                <div className="max-w-[54ch] space-y-2">
                  <h2 className="font-display text-lg sm:text-xl font-medium text-[#2D3142]">
                    {enrichmentStatus === "FAILED"
                      ? "Não conseguimos montar esta sessão ainda"
                      : "Sua sessão está pronta para ser montada"}
                  </h2>
                  <p className="text-xs font-medium tabular-nums text-[#646B82]">
                    Duração estimada: {durationMinutes} min · Geração sob demanda
                  </p>
                </div>

                {enrichError && (
                  <p className="rounded-xl bg-[#FFF0E5] px-4 py-2.5 text-xs font-medium text-[#C4553F]">
                    {enrichError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handlePrepareNow}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF9B85] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#f28972] cursor-pointer"
                >
                  {enrichmentStatus === "FAILED" ? (
                    <>
                      <ArrowRotateLeft className="size-4" />
                      <span>Tentar novamente</span>
                    </>
                  ) : (
                    <>
                      <Play className="size-4" />
                      <span>Preparar sessão agora</span>
                    </>
                  )}
                </button>
              </>
          </section>
        ) : (
          <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-7 py-6 text-center sm:py-8">
            <MascotBee pose="celebrating" className="h-20 w-24" />

            <div className="max-w-[46ch] space-y-1.5">
              <h2 className="font-display text-2xl font-medium tracking-tight text-[#2D3142]">
                Sessão concluída
              </h2>
              <p className="text-[13px] leading-relaxed text-[#646B82]">
                Como foi o ritmo hoje? Seu feedback calibra automaticamente a próxima sessão.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const active = difficulty === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDifficulty(opt.value)}
                    className={`rounded-2xl border px-3.5 py-3 text-left transition-all cursor-pointer ${
                      active
                        ? "border-[#5B8DEF]/45 bg-[#E8F0FE]/55"
                        : "border-[#2D3142]/8 bg-white hover:border-[#2D3142]/18"
                    }`}
                  >
                    <span
                      className={`block text-[13px] font-semibold ${
                        active ? "text-[#3E6FD6]" : "text-[#2D3142]"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-[#646B82]">
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="w-full rounded-2xl border border-[#2D3142]/8 bg-white px-4 py-3 text-left transition-colors focus-within:border-[#5B8DEF]/50 focus-within:bg-white">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="session-notes"
                  className="text-xs font-medium text-[#2D3142]/80"
                >
                  Dúvida ou anotação para a próxima sessão
                </label>
                <span className="text-[11px] text-[#646B82]/70">Opcional</span>
              </div>
              <textarea
                id="session-notes"
                rows={3}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Ex.: Quero revisar um pouco mais a parte prática na próxima aula..."
                className="w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-relaxed text-[#2D3142] placeholder:text-[#646B82]/50 focus:outline-none focus:ring-0"
              />
            </div>

            {saveError && (
              <p className="text-xs font-normal text-[#C85A54]">{saveError}</p>
            )}

            <div className="flex w-full flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setFinished(false)}
                className="rounded-xl px-3.5 py-2 text-[13px] font-medium text-[#646B82] transition-colors hover:bg-[#F3EFE6]/80 hover:text-[#2D3142] cursor-pointer"
              >
                Revisar passos
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinishSession}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF9B85] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#f28972] disabled:opacity-50 cursor-pointer"
              >
                <CircleCheck className="size-4" />
                <span>{isSaving ? "Salvando..." : "Finalizar e voltar ao plano"}</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
