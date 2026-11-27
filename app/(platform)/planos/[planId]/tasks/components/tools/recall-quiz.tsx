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
import type { RecallQuizData, QuizQuestion } from "./types";

type Phase = "answering" | "confirmed";

export interface LiveQuizState {
  activeQuestionId: string;
  phase: Phase;
  selectedOptionId: string | null;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function RecallQuiz({
  quiz,
  onComplete,
  onStateChange,
}: {
  quiz: RecallQuizData;
  onComplete?: (result: { correct: number; total: number }) => void;
  onStateChange?: (state: LiveQuizState) => void;
}) {
  const questions = useMemo(() => quiz.questions ?? [], [quiz]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [activeQuestions, setActiveQuestions] =
    useState<QuizQuestion[]>(questions);
  const [isRetry, setIsRetry] = useState(false);
  const [done, setDone] = useState(false);

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

  const confirm = () => {
    if (!selected) return;
    setPhase("confirmed");
    if (selected !== question.correctOptionId) {
      setWrongIds((prev) => new Set(prev).add(question.id));
    }
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setSelected(null);
      setPhase("answering");
    } else {
      setDone(true);
      onComplete?.({ correct: total - wrongIds.size, total });
    }
  };

  const retryWrong = () => {
    setActiveQuestions(questions.filter((q) => wrongIds.has(q.id)));
    setWrongIds(new Set());
    setIsRetry(true);
    setDone(false);
    setIndex(0);
    setSelected(null);
    setPhase("answering");
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
              onClick={() => setSelected(option.id)}
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
