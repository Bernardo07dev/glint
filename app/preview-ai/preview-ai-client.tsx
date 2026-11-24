"use client";

import { useState } from "react";
import Link from "next/link";
import { Xmark } from "@gravity-ui/icons";
import { SessionStep } from "@/app/(platform)/planos/[planId]/tasks/components/tools/session-step";
import { StepStage } from "@/app/(platform)/planos/[planId]/tasks/components/tools/step-stage";
import { parseTaskContent, resolveSteps } from "@/lib/task-content";
import { fixtureContent } from "./fixture";

// Simula a leitura de `PlanTask.content` do banco: valida o JSON e liga cada step à sua tool
const content = parseTaskContent(fixtureContent);
const resolvedSteps = content ? resolveSteps(content) : [];

export function PreviewAiClient() {
  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const steps = resolvedSteps;
  const resolved = steps[stepIndex];
  const step = resolved?.step;

  if (!step) {
    return <main className="p-10 text-sm text-[#646B82]">Conteúdo da sessão inválido</main>;
  }

  return (
    <main className="min-h-dvh bg-[#FFFDF8]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#2D3142]">
              Configurar o CLAUDE.md do seu projeto
            </h1>
          </div>
          <Link
            href="/home"
            aria-label="Sair da sessão"
            className="flex size-9 items-center justify-center rounded-xl bg-[#F3EFE6] text-[#646B82] transition-colors hover:bg-[#eae4d7] cursor-pointer"
          >
            <Xmark className="size-4" />
          </Link>
        </header>

        {finished ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white border border-[#95E1B0]/40 px-6 py-10 text-center">
            <h2 className="font-display text-2xl font-medium text-[#2D3142]">Sessão concluída</h2>
            <p className="max-w-[52ch] text-sm text-[#646B82]">
              Os 3 passos foram percorridos. Aqui entra o feedback de dificuldade e o registro do progresso.
            </p>
            <button
              type="button"
              onClick={() => {
                setFinished(false);
                setStepIndex(0);
                setQuizDone(false);
              }}
              className="rounded-xl bg-[#F3EFE6] px-5 py-2.5 text-sm font-medium text-[#646B82] transition-colors hover:bg-[#eae4d7] cursor-pointer"
            >
              Recomeçar preview
            </button>
          </div>
        ) : (
          <div>
            <SessionStep
              key={step.id}
              step={step}
              stepIndex={stepIndex}
              totalSteps={steps.length}
              onSelectStep={setStepIndex}
              onBack={stepIndex > 0 ? () => setStepIndex(stepIndex - 1) : undefined}
              onNext={() =>
                stepIndex + 1 < steps.length
                  ? setStepIndex(stepIndex + 1)
                  : setFinished(true)
              }
              nextLabel={stepIndex + 1 < steps.length ? "Próximo passo" : "Concluir sessão"}
              nextPrimary={step.toolRef !== "active_recall_quiz" || quizDone}
            >
              <StepStage resolved={resolved} onQuizComplete={() => setQuizDone(true)} />
            </SessionStep>
          </div>
        )}
      </div>
    </main>
  );
}
