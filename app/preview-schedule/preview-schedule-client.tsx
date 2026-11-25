"use client";

import { QuestionRenderer } from "@/app/components/ai/question-renderer";
import type { QuestionPayload } from "@/app/components/ai/types";

const question: QuestionPayload = {
  id: "routine_and_slots",
  question:
    "Em quais dias e horários da semana você consegue estudar com foco?",
  inputType: "schedule_picker",
  defaultDurationMinutes: 45,
  occupiedSlots: [
    { dayOfWeek: "tuesday", startTime: "20:00", durationMinutes: 60 },
    { dayOfWeek: "wednesday", startTime: "19:00", durationMinutes: 45 },
    { dayOfWeek: "saturday", startTime: "10:00", durationMinutes: 30 },
  ],
};

export function PreviewScheduleClient() {
  return (
    <main className="min-h-dvh bg-[#FFFDF8] px-4 py-10 flex items-center justify-center">
      <QuestionRenderer
        question={question}
        onSubmit={(answer) => console.log("resposta:", answer)}
      />
    </main>
  );
}
