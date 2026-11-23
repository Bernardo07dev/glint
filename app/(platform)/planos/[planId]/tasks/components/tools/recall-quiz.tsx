"use client";

import { useMemo, useState } from "react";
import { CircleCheck, ArrowRotateLeft, Check, Xmark } from "@gravity-ui/icons";
import { MascotBee } from "@/app/components/mascot-bee";
import type { RecallQuizData, QuizQuestion } from "./types";

type Phase = "answering" | "confirmed";

export function RecallQuiz({
  quiz,
  onComplete,
}: {
  quiz: RecallQuizData;
  onComplete?: (result: { correct: number; total: number }) => void;
}) {
  const questions = useMemo(() => quiz.questions ?? [], [quiz]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(questions);
  const [isRetry, setIsRetry] = useState(false);
  const [done, setDone] = useState(false);

  const total = activeQuestions.length;
  const question = activeQuestions[index];

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
      <section className="flex flex-col items-center gap-4 rounded-2xl bg-[#95E1B0]/15 px-6 py-8 text-center">
        <MascotBee pose="celebrating" className="h-20 w-24" />
        <div className="space-y-1">
          <h3 className="font-display text-lg font-medium text-[#2D3142]">
            {allRight ? "Quiz completo" : "Quiz concluído"}
          </h3>
          <p className="text-sm text-[#646B82]">
            Você acertou{" "}
            <span className="font-medium tabular-nums text-[#2B6E47]">
              {correct} de {total}
            </span>{" "}
            {total === 1 ? "pergunta" : "perguntas"}
            {isRetry ? " nesta revisão" : ""}.
          </p>
        </div>
        {wrongIds.size > 0 && (
          <button
            type="button"
            onClick={retryWrong}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFE07D] px-5 py-2.5 text-xs font-semibold text-[#2D3142] transition-colors hover:bg-[#ffd16a] cursor-pointer"
          >
            <ArrowRotateLeft className="size-4" />
            <span>
              Refazer {wrongIds.size === 1 ? "a pergunta que errei" : `as ${wrongIds.size} que errei`}
            </span>
          </button>
        )}
      </section>
    );
  }

  const correctOption = question.options.find((o) => o.id === question.correctOptionId);
  const isCorrect = selected === question.correctOptionId;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs tabular-nums text-[#646B82]">
          Pergunta {index + 1} de {total}
          {isRetry && <span> · revisão</span>}
        </p>
        <div className="flex items-center gap-1.5">
          {activeQuestions.map((q, i) => {
            const answered = i < index || (i === index && phase === "confirmed");
            const wasWrong = answered && wrongIds.has(q.id);
            return (
              <span
                key={q.id}
                className={`size-2 rounded-full ${
                  i === index
                    ? "bg-[#5B8DEF]"
                    : answered
                      ? wasWrong
                        ? "bg-[#FF9B85]"
                        : "bg-[#95E1B0]"
                      : "bg-[#F3EFE6]"
                }`}
              />
            );
          })}
        </div>
      </div>

      <h3 className="font-display text-base font-medium leading-snug text-[#2D3142]">
        {question.question}
      </h3>

      <div className="space-y-2.5">
        {question.options.map((option) => {
          const isSelected = selected === option.id;
          const isRight = option.id === question.correctOptionId;
          const showState = phase === "confirmed";

          let ring = "border-[#2D3142]/10 bg-white hover:bg-[#F3EFE6]/60";
          if (isSelected && !showState) ring = "border-[#5B8DEF] bg-[#E8F0FE]/60";
          if (showState && isRight) ring = "border-[#95E1B0] bg-[#95E1B0]/15";
          if (showState && isSelected && !isRight) ring = "border-[#FF9B85] bg-[#FFF0E5]/70";
          if (showState && !isRight && !isSelected) ring = "border-[#2D3142]/8 bg-white text-[#646B82]";

          const showExplanation =
            showState && (isRight || isSelected);

          return (
            <button
              key={option.id}
              type="button"
              disabled={showState}
              onClick={() => setSelected(option.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer disabled:cursor-default ${ring}`}
            >
              <span className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                    showState && isRight
                      ? "border-[#95E1B0] bg-[#95E1B0] text-white"
                      : showState && isSelected
                        ? "border-[#FF9B85] bg-[#FF9B85] text-white"
                        : isSelected
                          ? "border-[#5B8DEF] bg-[#5B8DEF] text-white"
                          : "border-[#2D3142]/20 text-transparent"
                  }`}
                >
                  {showState && isRight ? (
                    <Check className="size-3" />
                  ) : showState && isSelected ? (
                    <Xmark className="size-3" />
                  ) : (
                    <Check className="size-3" />
                  )}
                </span>
                <span className="space-y-1.5">
                  <span className="block text-sm leading-snug text-[#2D3142]">
                    {option.text}
                  </span>
                  {showExplanation && (
                    <span className="block text-sm leading-relaxed text-[#646B82]">
                      {option.explanation}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {phase === "confirmed" && (
        <div className="rounded-xl bg-[#FFF0E5] px-4 py-3.5">
          <p className="text-xs font-medium text-[#C4553F]">
            {isCorrect ? "Mandou bem" : "Nota do mentor"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#2D3142]">
            {question.explanation}
          </p>
          {!isCorrect && correctOption && (
            <p className="mt-2 text-sm text-[#2B6E47]">
              Resposta certa: {correctOption.text}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span />
        {phase === "answering" ? (
          <button
            type="button"
            disabled={!selected}
            onClick={confirm}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF9B85] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#f28972] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <span>Confirmar</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF9B85] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#f28972] cursor-pointer"
          >
            <CircleCheck className="size-4" />
            <span>{index + 1 < total ? "Próxima pergunta" : "Ver resultado"}</span>
          </button>
        )}
      </div>
    </section>
  );
}
