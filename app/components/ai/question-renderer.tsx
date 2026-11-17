"use client";

import { useState } from "react";
import { MascotBee } from "../mascot-bee";
import { QuestionChoice } from "./question-choice";
import { QuestionSchedule } from "./question-schedule";
import { QuestionText } from "./question-text";
import type { QuestionAnswer, QuestionPayload } from "./types";

interface QuestionRendererProps {
  question: QuestionPayload;
  progress?: { current: number; total: number };
  isSubmitting?: boolean;
  onSubmit: (answer: QuestionAnswer) => void;
}

export function QuestionRenderer({
  question,
  isSubmitting = false,
  onSubmit,
}: QuestionRendererProps) {
  const [beeReactionTrigger, setBeeReactionTrigger] = useState(0);

  return (
    <section
      aria-live="polite"
      className="w-full max-w-2xl mx-auto space-y-6"
    >

      <header className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        <MascotBee
          pose="curious"
          glasses
          lookAtUser
          dynamic
          reactionTrigger={beeReactionTrigger}
          className="h-16 w-20 sm:h-14 sm:w-16 shrink-0 sm:-mt-1"
        />
        <div className=" max-w-[68ch]">
          <h1 className="font-display text-xl sm:text-2xl font-medium leading-snug text-[#2D3142]">
            {question.question}
          </h1>
        </div>
      </header>

      <div key={question.id}>
        {question.inputType === "text" && (
          <QuestionText
            placeholder={question.placeholder}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        )}

        {(question.inputType === "single_choice" ||
          question.inputType === "multi_choice") && (
          <QuestionChoice
            mode={question.inputType}
            options={question.options ?? []}
            allowCustom={question.allowCustom}
            isSubmitting={isSubmitting}
            onOptionSelect={() => setBeeReactionTrigger((n) => n + 1)}
            onSubmit={onSubmit}
          />
        )}

        {question.inputType === "schedule_picker" && (
          <QuestionSchedule
            defaultDurationMinutes={question.defaultDurationMinutes}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </section>
  );
}
