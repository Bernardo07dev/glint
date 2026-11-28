"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowRotateLeft,
  Check,
  CircleCheck,
  Xmark,
} from "@gravity-ui/icons";
import { MascotBee } from "@/app/components/mascot-bee";
import type { StepQuizAttempt, StepQuizProgress } from "@/lib/tasks/step-progress";
import type { RecallQuizData, QuizQuestion } from "./types";

type Phase = "answering" | "confirmed";

export interface LiveQuizState {
  activeQuestionId: string;
  phase: Phase;
  selectedOptionId: string | null;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

interface HydratedQuizState {
  activeQuestions: QuizQuestion[];
  index: number;
  selected: string | null;
  phase: Phase;
  wrongIds: Set<string>;
  isRetry: boolean;
  done: boolean;
  firstAttemptScore?: { correct: number; total: number };
  firstAttemptWrongQuestionIds: string[];
  attempts: StepQuizAttempt[];
}

function hydrateQuizState(
  questions: QuizQuestion[],
  initialProgress?: StepQuizProgress | null,
): HydratedQuizState {
  if (!initialProgress || questions.length === 0) {
    return {
      activeQuestions: questions,
      index: 0,
      selected: null,
      phase: "answering",
      wrongIds: new Set(),
      isRetry: false,
      done: false,
      firstAttemptScore: undefined,
      firstAttemptWrongQuestionIds: [],
      attempts: [],
    };
  }

  const questionById = new Map(questions.map((q) => [q.id, q]));

  // Reconstrói a fila de questões da rodada salva (ou usa fallback determinístico)
  const queueFromIds = (initialProgress.questionQueueIds ?? [])
    .map((id) => questionById.get(id))
    .filter((q): q is QuizQuestion => Boolean(q));

  const fallbackRetryQueue = initialProgress.isRetryRound
    ? (initialProgress.firstAttemptWrongQuestionIds ?? [])
        .map((id) => questionById.get(id))
        .filter((q): q is QuizQuestion => Boolean(q))
    : [];

  const resolvedQueue =
    queueFromIds.length > 0
      ? queueFromIds
      : fallbackRetryQueue.length > 0
        ? fallbackRetryQueue
        : questions;

  const foundIndex = initialProgress.activeQuestionId
    ? resolvedQueue.findIndex((q) => q.id === initialProgress.activeQuestionId)
    : 0;
  const resolvedIndex =
    foundIndex >= 0
      ? foundIndex
      : initialProgress.completed
        ? Math.max(0, resolvedQueue.length - 1)
        : 0;

  // Reconstrói wrongIds da rodada atual
  let roundWrongIds = new Set<string>(
    (initialProgress.currentRoundWrongQuestionIds ?? []).filter((id) =>
      questionById.has(id),
    ),
  );

  if (
    roundWrongIds.size === 0 &&
    !initialProgress.isRetryRound &&
    initialProgress.firstAttemptWrongQuestionIds?.length
  ) {
    const upToIdx =
      initialProgress.phase === "confirmed" || initialProgress.completed
        ? resolvedIndex
        : resolvedIndex - 1;
    const answeredIdSet = new Set(
      resolvedQueue.slice(0, Math.max(0, upToIdx + 1)).map((q) => q.id),
    );
    roundWrongIds = new Set(
      initialProgress.firstAttemptWrongQuestionIds.filter((id) =>
        answeredIdSet.has(id),
      ),
    );
  }

  const currentQuestion = resolvedQueue[resolvedIndex];
  const validSelected =
    currentQuestion &&
    initialProgress.selectedOptionId &&
    currentQuestion.options.some(
      (opt) => opt.id === initialProgress.selectedOptionId,
    )
      ? initialProgress.selectedOptionId
      : null;

  const resolvedPhase: Phase =
    initialProgress.phase === "confirmed" && validSelected
      ? "confirmed"
      : "answering";

  return {
    activeQuestions: resolvedQueue,
    index: resolvedIndex,
    selected: validSelected,
    phase: resolvedPhase,
    wrongIds: roundWrongIds,
    isRetry: Boolean(initialProgress.isRetryRound),
    done: Boolean(initialProgress.completed),
    firstAttemptScore: initialProgress.firstAttemptScore,
    firstAttemptWrongQuestionIds:
      initialProgress.firstAttemptWrongQuestionIds ?? [],
    attempts: initialProgress.attempts ?? [],
  };
}

export function RecallQuiz({
  quiz,
  initialProgress,
  onComplete,
  onStateChange,
  onProgressChange,
}: {
  quiz: RecallQuizData;
  initialProgress?: StepQuizProgress | null;
  onComplete?: (result: { correct: number; total: number }) => void;
  onStateChange?: (state: LiveQuizState) => void;
  onProgressChange?: (progress: StepQuizProgress) => void;
}) {
  const questions = useMemo(() => quiz.questions ?? [], [quiz]);
  const hydrated = useMemo(
    () => hydrateQuizState(questions, initialProgress),
    // Reidrata apenas na montagem do step
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions],
  );

  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(
    hydrated.activeQuestions,
  );
  const [index, setIndex] = useState(hydrated.index);
  const [selected, setSelected] = useState<string | null>(hydrated.selected);
  const [phase, setPhase] = useState<Phase>(hydrated.phase);
  const [wrongIds, setWrongIds] = useState<Set<string>>(hydrated.wrongIds);
  const [isRetry, setIsRetry] = useState(hydrated.isRetry);
  const [done, setDone] = useState(hydrated.done);
  const [firstAttemptScore, setFirstAttemptScore] = useState<
    { correct: number; total: number } | undefined
  >(hydrated.firstAttemptScore);
  const [firstAttemptWrongIds, setFirstAttemptWrongIds] = useState<string[]>(
    hydrated.firstAttemptWrongQuestionIds,
  );
  const [attempts, setAttempts] = useState<StepQuizAttempt[]>(
    hydrated.attempts,
  );

  const total = activeQuestions.length;
  const question = activeQuestions[index];

  useEffect(() => {
    if (question) {
      onStateChange?.({
        activeQuestionId: question.id,
        phase,
        selectedOptionId: selected,
      });
    }
  }, [question, phase, selected, onStateChange]);

  if (!question && !done) return null;

  const emitProgress = (nextState: {
    activeQuestionId: string | null;
    selectedOptionId: string | null;
    phase: Phase;
    isRetryRound: boolean;
    completed: boolean;
    questionQueue: QuizQuestion[];
    roundWrongSet: Set<string>;
    firstScore?: { correct: number; total: number };
    firstWrongIds: string[];
    attemptsList: StepQuizAttempt[];
  }) => {
    onProgressChange?.({
      activeQuestionId: nextState.activeQuestionId,
      selectedOptionId: nextState.selectedOptionId,
      phase: nextState.phase,
      isRetryRound: nextState.isRetryRound,
      completed: nextState.completed,
      questionQueueIds: nextState.questionQueue.map((q) => q.id),
      currentRoundWrongQuestionIds: Array.from(nextState.roundWrongSet),
      ...(nextState.firstScore
        ? { firstAttemptScore: nextState.firstScore }
        : {}),
      firstAttemptWrongQuestionIds: nextState.firstWrongIds,
      attempts: nextState.attemptsList,
    });
  };

  const handleSelectOption = (optionId: string) => {
    if (phase === "confirmed" || !question) return;
    setSelected(optionId);
    emitProgress({
      activeQuestionId: question.id,
      selectedOptionId: optionId,
      phase: "answering",
      isRetryRound: isRetry,
      completed: done,
      questionQueue: activeQuestions,
      roundWrongSet: wrongIds,
      firstScore: firstAttemptScore,
      firstWrongIds: firstAttemptWrongIds,
      attemptsList: attempts,
    });
  };

  const confirm = () => {
    if (!selected || !question) return;
    const isCorrect = selected === question.correctOptionId;
    const nextWrongIds = new Set(wrongIds);
    if (!isCorrect) {
      nextWrongIds.add(question.id);
    }

    const nextFirstWrongIds =
      !isRetry && !isCorrect && !firstAttemptWrongIds.includes(question.id)
        ? [...firstAttemptWrongIds, question.id]
        : firstAttemptWrongIds;

    const newAttempt: StepQuizAttempt = {
      questionId: question.id,
      selectedOptionId: selected,
      isCorrect,
      isRetry,
      answeredAt: new Date().toISOString(),
    };
    const nextAttempts = [...attempts, newAttempt];

    setPhase("confirmed");
    setWrongIds(nextWrongIds);
    setFirstAttemptWrongIds(nextFirstWrongIds);
    setAttempts(nextAttempts);

    emitProgress({
      activeQuestionId: question.id,
      selectedOptionId: selected,
      phase: "confirmed",
      isRetryRound: isRetry,
      completed: done,
      questionQueue: activeQuestions,
      roundWrongSet: nextWrongIds,
      firstScore: firstAttemptScore,
      firstWrongIds: nextFirstWrongIds,
      attemptsList: nextAttempts,
    });
  };

  const next = () => {
    if (index + 1 < total) {
      const nextIndex = index + 1;
      const nextQuestion = activeQuestions[nextIndex];
      setIndex(nextIndex);
      setSelected(null);
      setPhase("answering");

      emitProgress({
        activeQuestionId: nextQuestion?.id ?? null,
        selectedOptionId: null,
        phase: "answering",
        isRetryRound: isRetry,
        completed: done,
        questionQueue: activeQuestions,
        roundWrongSet: wrongIds,
        firstScore: firstAttemptScore,
        firstWrongIds: firstAttemptWrongIds,
        attemptsList: attempts,
      });
    } else {
      const roundScore = { correct: total - wrongIds.size, total };
      const resolvedFirstScore =
        firstAttemptScore ?? (!isRetry ? roundScore : undefined);

      setDone(true);
      if (resolvedFirstScore && !firstAttemptScore) {
        setFirstAttemptScore(resolvedFirstScore);
      }
      onComplete?.(roundScore);

      emitProgress({
        activeQuestionId: null,
        selectedOptionId: null,
        phase: "confirmed",
        isRetryRound: isRetry,
        completed: true,
        questionQueue: activeQuestions,
        roundWrongSet: wrongIds,
        firstScore: resolvedFirstScore,
        firstWrongIds: firstAttemptWrongIds,
        attemptsList: attempts,
      });
    }
  };

  const retryWrong = () => {
    const retryQueue = questions.filter((q) => wrongIds.has(q.id));
    if (retryQueue.length === 0) return;

    const emptySet = new Set<string>();
    setActiveQuestions(retryQueue);
    setWrongIds(emptySet);
    setIsRetry(true);
    setDone(false);
    setIndex(0);
    setSelected(null);
    setPhase("answering");

    emitProgress({
      activeQuestionId: retryQueue[0]?.id ?? null,
      selectedOptionId: null,
      phase: "answering",
      isRetryRound: true,
      completed: false,
      questionQueue: retryQueue,
      roundWrongSet: emptySet,
      firstScore: firstAttemptScore,
      firstWrongIds: firstAttemptWrongIds,
      attemptsList: attempts,
    });
  };

  if (done) {
    const correct = total - wrongIds.size;
    const allRight = wrongIds.size === 0;
    return (
      <section className="flex flex-col items-center gap-5 rounded-2xl border border-[#95E1B0]/50 bg-[#FFFDF8] px-6 py-9 text-center">
        <MascotBee
          pose={allRight ? "celebrating" : "focus"}
          className="h-20 w-24"
        />
        <div className="space-y-1.5">
          <h3 className="font-display text-xl font-medium text-[#2D3142]">
            {allRight ? "Fixação validada" : "Rodada concluída"}
          </h3>
          <p className="text-sm text-[#646B82]">
            Você acertou{" "}
            <span className="font-semibold tabular-nums text-[#2B6E47]">
              {correct} de {total}
            </span>{" "}
            {total === 1 ? "pergunta" : "perguntas"}
            {isRetry ? " nesta revisão" : ""}
          </p>
        </div>
        {wrongIds.size > 0 && (
          <button
            type="button"
            onClick={retryWrong}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFE07D] px-5 py-2.5 text-xs font-semibold text-[#2D3142] transition-colors hover:bg-[#ffd56b] cursor-pointer"
          >
            <ArrowRotateLeft className="size-4" />
            <span>
              Revisar{" "}
              {wrongIds.size === 1
                ? "a pergunta que errei"
                : `as ${wrongIds.size} perguntas que errei`}
            </span>
          </button>
        )}
      </section>
    );
  }

  const isCorrect = selected === question.correctOptionId;

  return (
    <section className="space-y-5">
      {/* Cabeçalho de progresso das perguntas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tabular-nums text-[#646B82]">
            Pergunta {index + 1} de {total}
          </span>
          {isRetry && (
            <span className="rounded-md bg-[#FFE07D]/55 px-2 py-0.5 text-[11px] font-semibold text-[#2D3142]">
              Revisão
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {activeQuestions.map((q, i) => {
            const answered =
              i < index || (i === index && phase === "confirmed");
            const wasWrong = answered && wrongIds.has(q.id);
            return (
              <span
                key={q.id}
                className={`h-2 rounded-full transition-colors ${
                  i === index ? "w-6" : "w-2.5"
                } ${
                  answered
                    ? wasWrong
                      ? "bg-[#FF9B85]"
                      : "bg-[#95E1B0]"
                    : i === index
                      ? "bg-[#5B8DEF]"
                      : "bg-[#E5DFD3]"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Enunciado */}
      <h3 className="font-display text-lg sm:text-[19px] font-medium leading-snug text-[#2D3142] max-w-[66ch]">
        {question.question}
      </h3>

      {/* Lista de alternativas */}
      <div className="space-y-2.5">
        {question.options.map((option, optIdx) => {
          const letter = OPTION_LETTERS[optIdx] ?? String(optIdx + 1);
          const isSelected = selected === option.id;
          const isRight = option.id === question.correctOptionId;
          const showState = phase === "confirmed";

          let cardClass =
            "border-[#2D3142]/10 bg-white hover:border-[#5B8DEF]/35 hover:bg-[#E8F0FE]/25";
          let badgeClass =
            "border-[#2D3142]/12 bg-[#F3EFE6] text-[#2D3142]/80 group-hover:border-[#5B8DEF]/30 group-hover:bg-[#E8F0FE] group-hover:text-[#3E6FD6]";

          if (isSelected && !showState) {
            cardClass = "border-[#5B8DEF] bg-[#E8F0FE]/45";
            badgeClass = "border-[#5B8DEF] bg-[#5B8DEF] text-white";
          } else if (showState && isRight) {
            cardClass = "border-[#95E1B0] bg-[#95E1B0]/15";
            badgeClass = "border-[#95E1B0] bg-[#95E1B0] text-[#1F5134]";
          } else if (showState && isSelected && !isRight) {
            cardClass = "border-[#FF9B85] bg-[#FFF0E5]/70";
            badgeClass = "border-[#FF9B85] bg-[#FF9B85] text-white";
          } else if (showState) {
            cardClass = "border-[#2D3142]/8 bg-white/70 opacity-75";
            badgeClass = "border-[#2D3142]/10 bg-[#F3EFE6]/70 text-[#646B82]";
          }

          const showExplanation = showState && (isRight || isSelected);

          return (
            <button
              key={option.id}
              type="button"
              disabled={showState}
              onClick={() => handleSelectOption(option.id)}
              className={`group w-full rounded-2xl border p-4 text-left transition-colors cursor-pointer disabled:cursor-default ${cardClass}`}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border font-sans text-xs font-semibold transition-colors ${badgeClass}`}
                >
                  {showState && isRight ? (
                    <Check className="size-3.5" />
                  ) : showState && isSelected ? (
                    <Xmark className="size-3.5" />
                  ) : (
                    letter
                  )}
                </span>

                <div className="min-w-0 flex-1 space-y-2">
                  <span className="block text-[13px] sm:text-sm font-medium leading-[1.55] text-[#2D3142]">
                    {option.text}
                  </span>

                  {showExplanation && (
                    <span className="block border-t border-[#2D3142]/8 pt-2 text-xs leading-[1.6] text-[#2D3142]/80">
                      {option.explanation}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Síntese do mentor após confirmar */}
      {phase === "confirmed" && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#FF9B85]/25 bg-[#FFF0E5]/70 px-4 py-3.5">
          <MascotBee
            pose={isCorrect ? "celebrating" : "focus"}
            className="h-10 w-11 shrink-0"
          />
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold text-[#C4553F]">
              {isCorrect ? "Resposta certa · Ponto-chave" : "Síntese do mentor"}
            </p>
            <p className="text-[13px] leading-[1.6] text-[#2D3142]/90">
              {question.explanation}
            </p>
          </div>
        </div>
      )}

      {/* Ação de confirmar / avançar pergunta */}
      <div className="flex items-center justify-end">
        {phase === "answering" ? (
          <button
            type="button"
            disabled={!selected}
            onClick={confirm}
            className="inline-flex items-center gap-2 rounded-xl bg-[#5B8DEF] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#4a7de0] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <span>Confirmar resposta</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 rounded-xl bg-[#5B8DEF] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#4a7de0] cursor-pointer"
          >
            <span>
              {index + 1 < total ? "Próxima pergunta" : "Ver resultado do quiz"}
            </span>
            {index + 1 < total ? (
              <ArrowRight className="size-4" />
            ) : (
              <CircleCheck className="size-4" />
            )}
          </button>
        )}
      </div>
    </section>
  );
}
