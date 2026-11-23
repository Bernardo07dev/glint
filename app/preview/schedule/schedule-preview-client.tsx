"use client";

import { useState } from "react";
import { MascotBee } from "@/app/components/mascot-bee";
import { QuestionSchedule } from "@/app/components/ai/question-schedule";
import type { QuestionAnswer } from "@/app/components/ai/types";

export function SchedulePreviewClient() {
  const [lastAnswer, setLastAnswer] = useState<QuestionAnswer | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <MascotBee pose="curious" glasses className="w-20 h-20 shrink-0" />
        <div className="space-y-1">
          <h1 className="font-display text-xl sm:text-2xl font-medium text-[#2D3142] leading-snug">
            Quais dias e horários você realmente consegue estudar?
          </h1>
          <p className="font-sans text-[13px] text-[#646B82] leading-relaxed">
            Escolha os dias, ajuste o horário e defina a duração de cada sessão.
          </p>
        </div>
      </div>

      <QuestionSchedule
        defaultDurationMinutes={30}
        onSubmit={(answer) => setLastAnswer(answer)}
      />

      {lastAnswer && (
        <div className="rounded-2xl bg-[#F3EFE6] border border-[#2D3142]/8 p-4 space-y-2">
          <p className="font-sans text-xs font-semibold text-[#2D3142]">
            Payload enviado
          </p>
          <pre className="font-mono text-xs text-[#646B82] overflow-x-auto leading-relaxed">
            {JSON.stringify(lastAnswer, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
