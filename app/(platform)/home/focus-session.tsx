"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
} from "@gravity-ui/icons";
import { MascotBee } from "@/app/components/mascot-bee";
import {
  completeSessionAction,
  toggleStepAction,
} from "@/app/actions/session";
import type { DifficultyFeedback, ResolvedNextTask } from "@/lib/plan-structure";

interface FocusSessionProps {
  nextTask: ResolvedNextTask;
  onExit: () => void;
}

const FEEDBACK_OPTIONS: { value: DifficultyFeedback; label: string }[] = [
  { value: "easy", label: "Foi fácil" },
  { value: "just_right", label: "Na medida" },
  { value: "hard", label: "Puxado" },
];

export function FocusSession({ nextTask, onExit }: FocusSessionProps) {
  const router = useRouter();
  const { task, planId, planTitle } = nextTask;
  const steps = task.content?.steps ?? [];
  const video = task.content?.video ?? null;
  const consumeMin = task.schedule?.timeBreakdown?.consumeMinutes;
  const practiceMin = task.schedule?.timeBreakdown?.practiceMinutes;

  const [savedSteps, setSavedSteps] = useState<number[]>(
    Array.isArray(task.completedSteps) ? task.completedSteps : [],
  );
  const [optimisticSteps, setOptimisticSteps] = useOptimistic<number[], number>(
    savedSteps,
    (current, toggledIndex) =>
      current.includes(toggledIndex)
        ? current.filter((i) => i !== toggledIndex)
        : [...current, toggledIndex].sort((a, b) => a - b),
  );

  const [, startToggleTransition] = useTransition();
  const [isCompleting, startCompleteTransition] = useTransition();

  const [showSummary, setShowSummary] = useState(false);
  const [phase, setPhase] = useState<"study" | "feedback" | "celebration">("study");
  const [selectedFeedback, setSelectedFeedback] = useState<DifficultyFeedback>("just_right");
  const [error, setError] = useState<string | null>(null);

  const handleToggleStep = (index: number) => {
    startToggleTransition(async () => {
      setOptimisticSteps(index);
      const res = await toggleStepAction({
        planId,
        taskId: task.taskId,
        stepIndex: index,
      });
      if (res.success && res.completedSteps) {
        setSavedSteps(res.completedSteps);
      }
    });
  };

  const handleComplete = () => {
    setError(null);
    startCompleteTransition(async () => {
      const res = await completeSessionAction({
        planId,
        taskId: task.taskId,
        feedback: selectedFeedback,
      });
      if (!res.success) {
        setError(res.error ?? "Não foi possível concluir a sessão agora.");
        return;
      }
      setPhase("celebration");
    });
  };

  const handleReturnHome = () => {
    router.refresh();
    onExit();
  };

  const allStepsDone = steps.length > 0 && optimisticSteps.length >= steps.length;

  const youtubeSrc = video
    ? `https://www.youtube.com/embed/${encodeURIComponent(video.youtubeId)}?rel=0${
        typeof video.watchStartSeconds === "number"
          ? `&start=${video.watchStartSeconds}`
          : ""
      }${
        typeof video.watchEndSeconds === "number"
          ? `&end=${video.watchEndSeconds}`
          : ""
      }`
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#FFFDF8] text-[#2D3142] flex flex-col overflow-y-auto">
      {/* Header minimalista */}
      <header className="sticky top-0 z-10 bg-[#FFFDF8]/95 backdrop-blur border-b border-[#F3EFE6]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={phase === "celebration" ? handleReturnHome : onExit}
            className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium text-[#646B82] hover:text-[#2D3142] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Sair da sessão</span>
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden sm:inline text-xs text-[#646B82] truncate max-w-[260px]">
              {planTitle}
            </span>
            {steps.length > 0 && (
              <span className="rounded-full bg-[#E8F0FE] text-[#5B8DEF] px-3 py-1 text-xs font-semibold tabular-nums shrink-0">
                {optimisticSteps.length}/{steps.length} passos
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Corpo */}
      <div className="flex-1 max-w-[1120px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {phase === "celebration" ? (
          <div className="max-w-md mx-auto py-12 text-center space-y-5">
            <MascotBee pose="celebrating" className="h-28 w-32 mx-auto" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#95E1B0]/30 text-[#2B6E47] px-3.5 py-1 text-xs font-semibold">
                <CircleCheck className="size-4" />
                <span>Sessão concluída</span>
              </div>
              <h1 className="font-display text-3xl font-medium text-[#2D3142]">
                Mandou bem!
              </h1>
              <p className="text-sm text-[#646B82] leading-relaxed">
                Mais um tijolo colocado no seu plano. Seu progresso já foi atualizado no calendário.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleReturnHome}
                className="inline-flex items-center justify-center rounded-2xl bg-[#FF9B85] hover:bg-[#f28972] text-white font-semibold text-sm px-7 py-3.5 transition-colors cursor-pointer"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contexto */}
            <div className="space-y-2 max-w-[75ch]">
              {typeof consumeMin === "number" && typeof practiceMin === "number" && (
                <p className="text-xs font-medium text-[#5B8DEF] tabular-nums">
                  {consumeMin} min consumo · {practiceMin} min prática
                </p>
              )}
              <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#2D3142] leading-snug">
                {task.title}
              </h1>
              <p className="text-sm sm:text-[15px] text-[#646B82] leading-relaxed">
                {task.whyItMatters}
              </p>
            </div>

            {/* Layout 2 colunas com vídeo ou coluna centrada sem vídeo */}
            <div
              className={
                youtubeSrc
                  ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] gap-6 lg:gap-8 items-start"
                  : "max-w-[720px] space-y-6"
              }
            >
              {youtubeSrc && video && (
                <div className="space-y-3">
                  <div className="aspect-video w-full overflow-hidden rounded-2xl bg-[#2D3142] border border-[#F3EFE6]">
                    <iframe
                      src={youtubeSrc}
                      title={video.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div className="rounded-2xl bg-[#F3EFE6]/70 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#2D3142] truncate">
                          {video.title}
                        </p>
                        {video.channel && (
                          <p className="text-xs text-[#646B82]">{video.channel}</p>
                        )}
                      </div>
                      {video.transcriptSummary && (
                        <button
                          type="button"
                          onClick={() => setShowSummary((v) => !v)}
                          className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#5B8DEF] hover:bg-white/70 shrink-0 cursor-pointer"
                        >
                          <span>Resumo</span>
                          {showSummary ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {showSummary && video.transcriptSummary && (
                      <p className="text-sm text-[#646B82] leading-relaxed max-w-[75ch] pt-1 border-t border-[#2D3142]/8">
                        {video.transcriptSummary}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Checklist prática + Conclusão */}
              <div className="space-y-5">
                {steps.length > 0 && (
                  <div className="rounded-3xl bg-white border border-[#F3EFE6] p-5 sm:p-6 space-y-4">
                    <h2 className="font-display text-lg font-medium text-[#2D3142]">
                      Checklist prática
                    </h2>

                    <ul className="space-y-2.5">
                      {steps.map((stepText, idx) => {
                        const checked = optimisticSteps.includes(idx);
                        return (
                          <li key={idx}>
                            <button
                              type="button"
                              onClick={() => handleToggleStep(idx)}
                              className={`w-full text-left flex items-start gap-3 rounded-2xl p-3.5 transition-colors cursor-pointer border ${
                                checked
                                  ? "bg-[#95E1B0]/15 border-[#95E1B0]/40"
                                  : "bg-[#FFFDF8] border-[#F3EFE6] hover:bg-[#F3EFE6]/50"
                              }`}
                            >
                              <span
                                className={`mt-0.5 size-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                  checked
                                    ? "bg-[#95E1B0] text-[#2D3142]"
                                    : "border border-[#646B82]/40 bg-white"
                                }`}
                              >
                                {checked && <Check className="size-3.5" />}
                              </span>
                              <span
                                className={`text-sm leading-relaxed ${
                                  checked
                                    ? "line-through text-[#646B82]"
                                    : "text-[#2D3142]"
                                }`}
                              >
                                {stepText}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {phase === "study" ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setPhase("feedback")}
                      className={`w-full rounded-2xl font-semibold text-sm sm:text-base px-6 py-3.5 transition-colors cursor-pointer ${
                        allStepsDone
                          ? "bg-[#FF9B85] hover:bg-[#f28972] text-white"
                          : "bg-[#FF9B85]/85 hover:bg-[#FF9B85] text-white"
                      }`}
                    >
                      Concluir sessão
                    </button>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-[#FFF0E5]/80 border border-[#FF9B85]/30 p-5 sm:p-6 space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-medium text-[#2D3142]">
                        Como foi essa sessão?
                      </h3>
                      <p className="text-xs text-[#646B82]">
                        Isso ajuda o Glint a calibrar o ritmo das próximas semanas.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {FEEDBACK_OPTIONS.map((opt) => {
                        const active = selectedFeedback === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSelectedFeedback(opt.value)}
                            className={`rounded-xl py-2.5 px-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer border ${
                              active
                                ? "bg-[#5B8DEF] text-white border-[#5B8DEF]"
                                : "bg-white text-[#2D3142] border-[#F3EFE6] hover:bg-[#F3EFE6]/60"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    {error && <p className="text-xs text-red-600">{error}</p>}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPhase("study")}
                        disabled={isCompleting}
                        className="rounded-xl px-4 py-2 text-xs font-medium text-[#646B82] hover:bg-white/60 cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={handleComplete}
                        disabled={isCompleting}
                        className="rounded-xl bg-[#FF9B85] hover:bg-[#f28972] text-white font-semibold text-sm px-5 py-2.5 transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {isCompleting ? "Salvando..." : "Finalizar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
