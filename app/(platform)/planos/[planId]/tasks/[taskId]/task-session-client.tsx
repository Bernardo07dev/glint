"use client";

import { useState, useTransition } from "react";
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
  recordStepProgressAction,
} from "@/app/actions/session";
import { BeeLoader } from "@/app/components/bee-loader";
import { MascotBee } from "@/app/components/mascot-bee";
import { SessionStep } from "@/app/(platform)/planos/[planId]/tasks/components/tools/session-step";
import { StepStage } from "@/app/(platform)/planos/[planId]/tasks/components/tools/step-stage";
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

export function TaskSessionClient({
  planId,
  planTitle,
  taskKey,
  title,
  whyItMatters,
  durationMinutes,
  initialEnrichmentStatus,
  initialTaskStatus,
  initialContent,
  initialCompletedSteps,
}: TaskSessionClientProps) {
  const router = useRouter();
  const [content, setContent] = useState<TaskContent | null>(initialContent);
  const [enrichmentStatus, setEnrichmentStatus] = useState(
    initialEnrichmentStatus,
  );
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const steps = content ? resolveSteps(content) : [];
  const firstUnfinishedIdx = steps.findIndex(
    (s) => !initialCompletedSteps.includes(s.step.id),
  );
  const [stepIndex, setStepIndex] = useState(
    firstUnfinishedIdx >= 0 ? firstUnfinishedIdx : 0,
  );
  const [quizDone, setQuizDone] = useState(false);
  const [finished, setFinished] = useState(initialTaskStatus === "COMPLETED");

  const [difficulty, setDifficulty] = useState<DifficultyOption>("just_right");
  const [userNotes, setUserNotes] = useState("");
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

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
    if (current) {
      void recordStepProgressAction({
        planId,
        taskIdentifier: taskKey,
        stepId: current.step.id,
      });
    }

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
              <span className="truncate max-w-[46ch]">{planTitle}</span>
            </Link>
            <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#2D3142]">
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

        {/* Estado 1: Sessão ainda não enriquecida (PENDING / GENERATING / FAILED) */}
        {!content || !resolved ? (
          <section className="flex flex-col items-center gap-6 rounded-3xl border border-[#5B8DEF]/20 bg-white px-6 py-10 text-center sm:px-10">
            {isEnriching ? (
              <BeeLoader label="Montando vídeo, guia e quiz sob medida, isso pode demorar" />
            ) : (
              <>
                <MascotBee
                  pose={enrichmentStatus === "FAILED" ? "curious" : "focus"}
                  className="h-24 w-28"
                />
                <div className="max-w-[54ch] space-y-2">
                  <h2 className="font-display text-ld sm:text-xl font-medium text-[#2D3142]">
                    {enrichmentStatus === "FAILED"
                      ? "Não conseguimos montar esta sessão ainda"
                      : "Sua sessão está pronta para ser montada"}
                  </h2>
                  {/* <p className="text-sm leading-relaxed text-[#646B82]">
                    {whyItMatters}
                  </p> */}
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
            )}
          </section>
        ) : finished ? (
          /* Estado 2: Fechamento da Sessão + Feedback para próxima task JIT */
          <section className="flex flex-col items-center gap-6 rounded-3xl border border-[#95E1B0]/50 bg-white px-6 py-10 text-center sm:px-10">
            <MascotBee pose="celebrating" className="h-24 w-28" />

            <div className="max-w-[54ch] space-y-1.5">
              <h2 className="font-display text-2xl font-medium text-[#2D3142]">
                Sessão concluída
              </h2>
              <p className="text-sm text-[#646B82]">
                Como foi o ritmo hoje? Seu feedback calibra automaticamente a próxima sessão.
              </p>
            </div>

            <div className="grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-3">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const active = difficulty === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDifficulty(opt.value)}
                    className={`rounded-2xl border p-3.5 text-left transition-colors cursor-pointer ${
                      active
                        ? "border-[#5B8DEF] bg-[#E8F0FE]/60"
                        : "border-[#2D3142]/10 bg-[#FFFDF8] hover:border-[#5B8DEF]/35"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-[#2D3142]">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-[#646B82]">
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="w-full max-w-lg text-left">
              <label
                htmlFor="session-notes"
                className="mb-2.5 block text-xs font-medium text-[#646B82]"
              >
                Alguma dúvida ou anotação para a próxima sessão? (opcional)
              </label>
              <textarea
                id="session-notes"
                rows={2}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Ex.: Quero revisar um pouco mais a parte prática na próxima aula..."
                className="w-full rounded-2xl border border-[#2D3142]/12 bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#2D3142] placeholder:text-[#646B82]/60 focus:border-[#5B8DEF] focus:outline-none"
              />
            </div>

            {saveError && (
              <p className="text-xs font-medium text-[#C4553F]">{saveError}</p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setFinished(false)}
                className="rounded-xl bg-[#F3EFE6] px-5 py-2.5 text-sm font-semibold text-[#2D3142]/80 transition-colors hover:bg-[#eae4d7] cursor-pointer"
              >
                Revisar passos
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinishSession}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF9B85] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#f28972] disabled:opacity-50 cursor-pointer"
              >
                <CircleCheck className="size-4" />
                <span>{isSaving ? "Salvando..." : "Finalizar e voltar ao plano"}</span>
              </button>
            </div>
          </section>
        ) : (
          /* Estado 3: Sessão Ativa (Stepper Tool -> Walkthrough) */
          <SessionStep
            key={resolved.step.id}
            step={resolved.step}
            stepIndex={stepIndex}
            totalSteps={steps.length}
            onSelectStep={setStepIndex}
            onBack={
              stepIndex > 0 ? () => setStepIndex(stepIndex - 1) : undefined
            }
            onNext={handleNextStep}
            nextLabel={
              stepIndex + 1 < steps.length
                ? "Próximo passo"
                : "Concluir sessão"
            }
            nextPrimary={
              resolved.step.toolRef !== "active_recall_quiz" || quizDone
            }
          >
            <StepStage
              resolved={resolved}
              onQuizComplete={() => setQuizDone(true)}
            />
          </SessionStep>
        )}
      </div>
    </main>
  );
}
