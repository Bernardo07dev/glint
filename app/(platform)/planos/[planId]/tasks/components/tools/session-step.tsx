"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  CircleQuestion,
  Compass,
  Flag,
  Target,
  Video,
  Xmark,
} from "@gravity-ui/icons";
import { MascotBee } from "@/app/components/mascot-bee";
import type { SessionStepData, ToolId } from "./types";

const TOOL_META: Record<ToolId, { label: string; icon: typeof Video }> = {
  video: { label: "Vídeo guiado", icon: Video },
  concept_explainer: { label: "Guia do mentor", icon: BookOpen },
  active_recall_quiz: { label: "Quiz de fixação", icon: CircleQuestion },
};

const PHASE_LABEL: Record<SessionStepData["phase"], string> = {
  consume: "Consumo",
  practice: "Prática",
};

type WidgetId = "walkthrough" | "objective";

interface SessionStepProps {
  step: SessionStepData;
  stepIndex: number;
  totalSteps: number;
  children: ReactNode;
  onSelectStep?: (index: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextPrimary?: boolean;
}

function SidePanel({
  title,
  icon,
  badge,
  onClose,
  children,
}: {
  title: string;
  icon: ReactNode;
  badge?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <section
      aria-label={title}
      className="absolute left-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-[#2D3142]/10 bg-white shadow-[0_12px_32px_-12px_rgba(45,49,66,0.18)] lg:left-full lg:top-0 lg:mt-0 lg:ml-3 lg:w-80"
    >
      <header className="flex items-center justify-between gap-3 border-b border-[#2D3142]/8 bg-[#FFFDF8] px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="truncate text-[13px] font-semibold text-[#2D3142]">
            {title}
          </span>
          {badge && (
            <span className="rounded-md bg-[#F3EFE6] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[#646B82]">
              {badge}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#F3EFE6] text-[#646B82] transition-colors hover:bg-[#eae4d7] cursor-pointer"
        >
          <Xmark className="size-3.5" />
        </button>
      </header>
      <div className="max-h-[70dvh] overflow-y-auto p-3.5">{children}</div>
    </section>
  );
}

function StepTrail({
  stepIndex,
  totalSteps,
  onSelectStep,
}: {
  stepIndex: number;
  totalSteps: number;
  onSelectStep?: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div
        className="flex flex-1 items-center gap-2"
        role="progressbar"
        aria-label="Progresso da sessão"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={stepIndex + 1}
      >
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isCurrent = i === stepIndex;
          const isPast = i < stepIndex;

          return (
            <div key={i} className="flex flex-1 items-center gap-2">
              <span
                className={`h-0 flex-1 ${
                  i <= stepIndex
                    ? "border-t-[3px] border-solid border-[#5B8DEF]"
                    : "border-t-[3px] border-dotted border-[#FF9B85]/80"
                }`}
              />
              {onSelectStep ? (
                <button
                  type="button"
                  onClick={() => onSelectStep(i)}
                  aria-label={`Ir para o passo ${i + 1}`}
                  aria-current={isCurrent ? "step" : undefined}
                  title={`Passo ${i + 1}`}
                  className="flex items-center justify-center rounded-full p-0.5 transition-transform hover:scale-110 cursor-pointer"
                >
                  {isCurrent ? (
                    <MascotBee pose="standard" className="h-6 w-7 shrink-0" />
                  ) : (
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${
                        isPast
                          ? "bg-[#95E1B0]"
                          : "border-2 border-[#FF9B85]/80 bg-white"
                      }`}
                    />
                  )}
                </button>
              ) : isCurrent ? (
                <MascotBee pose="standard" className="h-6 w-7 shrink-0" />
              ) : (
                <span
                  className={`size-2.5 shrink-0 rounded-full ${
                    isPast
                      ? "bg-[#95E1B0]"
                      : "border-2 border-[#FF9B85]/80 bg-white"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <span className="shrink-0 text-xs font-medium tabular-nums text-[#646B82]">
        Passo {stepIndex + 1} de {totalSteps}
      </span>
    </div>
  );
}

/** Realça horários (ex: 01:15, 04:00) e comandos curtos (ex: /init, npm test) dentro do texto do roteiro */
function formatWalkthroughItem(text: string): ReactNode {
  const tokenRegex = /(\b\d{1,2}:\d{2}\b|`[^`]+`|\/[a-zA-Z0-9_-]+)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;
    if (/^\d{1,2}:\d{2}$/.test(part)) {
      return (
        <span
          key={idx}
          className="mx-0.5 inline-flex items-center rounded-md bg-[#E8F0FE] px-1.5 py-0.5 font-sans text-[11px] font-semibold tabular-nums text-[#3E6FD6]"
        >
          {part}
        </span>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="mx-0.5 rounded-md border border-[#2D3142]/10 bg-[#FFFDF8] px-1.5 py-0.5 font-mono text-[12px] text-[#2D3142]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("/")) {
      return (
        <code
          key={idx}
          className="mx-0.5 rounded-md border border-[#2D3142]/10 bg-[#FFFDF8] px-1.5 py-0.5 font-mono text-[12px] text-[#2D3142]"
        >
          {part}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function SessionStep({
  step,
  stepIndex,
  totalSteps,
  children,
  onSelectStep,
  onBack,
  onNext,
  nextLabel = "Próximo passo",
  nextPrimary = true,
}: SessionStepProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [openWidget, setOpenWidget] = useState<WidgetId | null>(null);

  const tool = TOOL_META[step.toolRef];
  const ToolIcon = tool?.icon;

  const totalWalkthrough = step.walkthrough.length;
  const completedWalkthrough = checked.size;
  const allWalkthroughDone =
    totalWalkthrough > 0 && completedWalkthrough === totalWalkthrough;

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const widgetClass = (id: WidgetId) =>
    `relative flex size-12 items-center justify-center rounded-2xl border transition-colors cursor-pointer ${
      openWidget === id
        ? "border-[#5B8DEF]/35 bg-[#E8F0FE] text-[#3E6FD6]"
        : "border-[#2D3142]/8 bg-white text-[#646B82] hover:bg-[#F3EFE6]"
    }`;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
      {/* Botões externos de Roteiro e Objetivo */}
      <aside className="relative order-1 flex gap-2.5 lg:order-3 lg:sticky lg:top-20 lg:flex-col">
        <button
          type="button"
          aria-label={`Roteiro deste passo, ${completedWalkthrough} de ${totalWalkthrough} itens feitos`}
          aria-expanded={openWidget === "walkthrough"}
          title="Roteiro"
          onClick={() =>
            setOpenWidget((w) => (w === "walkthrough" ? null : "walkthrough"))
          }
          className={widgetClass("walkthrough")}
        >
          <Compass className="size-5" />
          <span className="absolute inset-x-3 bottom-2 h-0.5 overflow-hidden rounded-full bg-[#2D3142]/10">
            <span
              className={`absolute inset-0 origin-left rounded-full transition-transform duration-300 ease-out ${
                allWalkthroughDone ? "bg-[#95E1B0]" : "bg-[#5B8DEF]"
              }`}
              style={{
                transform: `scaleX(${
                  totalWalkthrough > 0 ? completedWalkthrough / totalWalkthrough : 0
                })`,
              }}
            />
          </span>
        </button>

        <button
          type="button"
          aria-label="Objetivo e entrega deste passo"
          aria-expanded={openWidget === "objective"}
          title="Objetivo"
          onClick={() =>
            setOpenWidget((w) => (w === "objective" ? null : "objective"))
          }
          className={widgetClass("objective")}
        >
          <Target className="size-5" />
        </button>

        {openWidget === "walkthrough" && (
          <SidePanel
            title="Roteiro guiado"
            badge={`${completedWalkthrough}/${totalWalkthrough}`}
            icon={
              <Compass
                className={`size-4 ${
                  allWalkthroughDone ? "text-[#2B6E47]" : "text-[#5B8DEF]"
                }`}
              />
            }
            onClose={() => setOpenWidget(null)}
          >
            <ol className="space-y-2">
              {step.walkthrough.map((item, i) => {
                const isChecked = checked.has(i);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => toggle(i)}
                      className={`group flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                        isChecked
                          ? "border-transparent bg-[#F3EFE6]/50"
                          : "border-[#2D3142]/8 bg-[#FFFDF8] hover:border-[#5B8DEF]/30"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums transition-colors ${
                          isChecked
                            ? "border-[#95E1B0] bg-[#95E1B0] text-[#1F5134]"
                            : "border-[#2D3142]/15 bg-white text-[#2D3142]/80 group-hover:border-[#5B8DEF]/40 group-hover:bg-[#E8F0FE] group-hover:text-[#3E6FD6]"
                        }`}
                      >
                        {isChecked ? <Check className="size-3" /> : i + 1}
                      </span>
                      <span
                        className={`flex-1 text-xs leading-[1.6] ${
                          isChecked
                            ? "text-[#646B82] line-through decoration-[#646B82]/40"
                            : "text-[#2D3142]"
                        }`}
                      >
                        {formatWalkthroughItem(item)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </SidePanel>
        )}

        {openWidget === "objective" && (
          <SidePanel
            title="Objetivo e entrega"
            icon={<Target className="size-4 text-[#5B8DEF]" />}
            onClose={() => setOpenWidget(null)}
          >
            <div className="space-y-3">
              <div className="rounded-2xl border border-[#2D3142]/8 bg-[#FFFDF8] p-3.5 space-y-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#2D3142]">
                  <Target className="size-3.5 text-[#5B8DEF]" />
                  <span>Objetivo deste passo</span>
                </p>
                <p className="text-xs leading-[1.6] text-[#2D3142]/85">
                  {step.objective}
                </p>
              </div>

              <div className="rounded-2xl border border-[#FF9B85]/25 bg-[#FFF0E5]/60 p-3.5 space-y-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#2D3142]">
                  <Flag className="size-3.5 text-[#FF9B85]" />
                  <span>Ao concluir você terá</span>
                </p>
                <p className="text-xs leading-[1.6] text-[#2D3142]/85">
                  {step.deliverable}
                </p>
              </div>
            </div>
          </SidePanel>
        )}
      </aside>

      {/* Card principal da etapa */}
      <div className="order-3 min-w-0 flex-1 space-y-6 rounded-3xl border border-[#2D3142]/8 bg-white px-5 py-6 sm:px-8 sm:py-8 lg:order-1">
        <header className="space-y-4">
          <StepTrail
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            onSelectStep={onSelectStep}
          />

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium tabular-nums text-[#646B82]">
              {ToolIcon && <ToolIcon className="size-3.5 text-[#646B82]" />}
              <span>
                {tool?.label} · {PHASE_LABEL[step.phase]} · ~{step.estimatedMinutes} min
              </span>
            </p>

            <h2 className="font-display text-xl sm:text-2xl font-medium leading-snug tracking-tight text-[#2D3142]">
              {step.title}
            </h2>

            <p className="max-w-[68ch] text-sm leading-relaxed text-[#646B82]">
              {step.objective}
            </p>
          </div>
        </header>

        <div>{children}</div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#2D3142]/8 pt-5">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F3EFE6] px-4 py-2.5 text-[13px] font-semibold text-[#2D3142]/80 transition-colors hover:bg-[#eae4d7] cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Passo anterior</span>
            </button>
          ) : (
            <span />
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors cursor-pointer ${
                nextPrimary
                  ? "bg-[#FF9B85] text-white hover:bg-[#f28972]"
                  : "bg-[#F3EFE6] text-[#646B82] hover:bg-[#eae4d7]"
              }`}
            >
              <span>{nextLabel}</span>
              {stepIndex + 1 < totalSteps ? (
                <ArrowRight className="size-4" />
              ) : (
                <CircleCheck className="size-4" />
              )}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
