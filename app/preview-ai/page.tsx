"use client";

import { useState } from "react";
import { QuestionRenderer } from "../components/ai/question-renderer";
import type { QuestionAnswer, QuestionPayload } from "../components/ai/types";

const MOCK_QUESTIONS: QuestionPayload[] = [
  {
    id: "q-text",
    inputType: "text",
    question: "O que você quer ser capaz de fazer ao final dessa jornada?",
    helperText:
      "Quanto mais concreto for o resultado, melhor consigo montar suas sessões práticas.",
    placeholder:
      "Ex: Quero construir e publicar uma API REST em Python com FastAPI e testes automatizados",
  },
  {
    id: "q-single",
    inputType: "single_choice",
    question: "Qual é o seu nível atual nesse assunto?",
    helperText:
      "Isso define o ponto de partida da primeira semana sem repetir o que você já domina.",
    allowCustom: true,
    options: [
      {
        id: "beginner",
        label: "Começando do zero",
        description: "Nunca estudei isso na prática e quero base sólida",
      },
      {
        id: "intermediate",
        label: "Já tenho noção",
        description: "Entendo o básico, mas travo na hora de aplicar sozinho",
      },
      {
        id: "advanced",
        label: "Quero aprofundar",
        description: "Já uso no dia a dia e busco domínio mais avançado",
      },
    ],
  },
  {
    id: "q-multi",
    inputType: "multi_choice",
    question: "Quais formatos funcionam melhor para você aprender?",
    helperText:
      "Vou priorizar essas ferramentas quando montar o conteúdo de cada sessão.",
    allowCustom: true,
    options: [
      {
        id: "video",
        label: "Vídeos curtos e diretos",
        description: "Explicações visuais de até 15 minutos antes da prática",
      },
      {
        id: "practice",
        label: "Mão na massa com desafios",
        description: "Exercícios guiados logo após a teoria",
      },
      {
        id: "reading",
        label: "Resumo escrito e checklist",
        description: "Passo a passo objetivo para consultar rápido",
      },
    ],
  },
  {
    id: "q-schedule",
    inputType: "schedule_picker",
    question: "Quais dias e horários você realmente consegue estudar?",
    helperText:
      "Cada bloco vai direto para o seu calendário com o tempo exato de consumo e prática.",
    defaultDurationMinutes: 45,
  },
];

export default function PreviewAiPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [lastAnswer, setLastAnswer] = useState<QuestionAnswer | null>(null);

  const handleFlowSubmit = (answer: QuestionAnswer) => {
    setLastAnswer(answer);
    setStepIndex((prev) => (prev + 1) % MOCK_QUESTIONS.length);
  };

  return (
    <main className="min-h-screen bg-[#FFFDF8] text-[#2D3142] px-4 py-8 sm:py-12 sm:flex sm:flex-col sm:justify-center">
      <div className="w-full max-w-3xl mx-auto space-y-10">
        <div className="space-y-8">
          <QuestionRenderer
            question={MOCK_QUESTIONS[stepIndex]}
            progress={{
              current: stepIndex + 1,
              total: MOCK_QUESTIONS.length,
            }}
            onSubmit={handleFlowSubmit}
          />

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {MOCK_QUESTIONS.map((q, idx) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setStepIndex(idx)}
                className={`px-3 py-1.5 rounded-lg font-sans text-xs font-medium transition-colors cursor-pointer ${
                  idx === stepIndex
                    ? "bg-[#E8F0FE] text-[#5B8DEF]"
                    : "bg-[#F3EFE6] text-[#646B82] hover:text-[#2D3142]"
                }`}
              >
                {q.inputType}
              </button>
            ))}
          </div>
        </div>

        {lastAnswer && (
          <aside className="rounded-2xl bg-[#F3EFE6] border border-[#2D3142]/10 p-4 space-y-2">
            <p className="font-sans text-xs font-semibold text-[#646B82]">
              Último payload emitido (onSubmit)
            </p>
            <pre className="font-mono text-xs text-[#2D3142] overflow-x-auto">
              {JSON.stringify(lastAnswer, null, 2)}
            </pre>
          </aside>
        )}
      </div>
    </main>
  );
}
