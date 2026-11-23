"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
    ListCheck,
  Target,
  Video,
  BookOpen,
  CircleQuestion,
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

type WidgetId = "walkthrough" | "deliverable";

interface SessionStepProps {
  step: SessionStepData;
  stepIndex: number;
  totalSteps: number;
  children: ReactNode; // palco da tool
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextPrimary?: boolean;
}

function SidePanel({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: ReactNode;
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
      className="absolute left-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-[#2D3142]/8 bg-white shadow-[0_12px_32px_-12px_rgba(45,49,66,0.18)] lg:left-full lg:top-0 lg:mt-0 lg:ml-3 lg:w-72"
    >
      <header className="flex items-center justify-between gap-3 border-b border-[#2D3142]/8 px-4 py-3">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-[#2D3142]">
          {icon}
          <span>{title}</span>
        </p>
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-lg bg-[#F3EFE6] text-[#646B82] transition-colors hover:bg-[#eae4d7] cursor-pointer"
        >
          <Xmark className="size-3.5" />
        </button>
      </header>
      <div className="max-h-[70dvh] overflow-y-auto px-3 py-3">{children}</div>
    </section>
  );
}

function StepTrail({ stepIndex, totalSteps }: { stepIndex: number; totalSteps: number }) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-label="Progresso da sessão"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={stepIndex + 1}
    >
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex flex-1 items-center gap-2">
          <span
            className={`h-0 flex-1 ${
              i <= stepIndex
                ? "border-t-[3px] border-solid border-[#5B8DEF]"
                : "border-t-[3px] border-dotted border-[#FF9B85]"
            }`}
          />
          {i === stepIndex ? (
            <MascotBee pose="standard" className="h-6 w-7 shrink-0" />
          ) : (
            <span
              className={`size-2.5 shrink-0 rounded-full ${
                i < stepIndex ? "bg-[#5B8DEF]" : "border-2 border-[#FF9B85] bg-white"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function SessionStep({
  step,
  stepIndex,
  totalSteps,
  children,
  onBack,
  onNext,
  nextLabel = "Próximo passo",
  nextPrimary = true,
}: SessionStepProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [openWidget, setOpenWidget] = useState<WidgetId | null>(null);
  const tool = TOOL_META[step.toolRef];
  const ToolIcon = tool?.icon;

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const walkthroughList = (
    <ul className="space-y-2">
      {step.walkthrough.map((item, i) => {
        const isChecked = checked.has(i);
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[#F3EFE6]/60 cursor-pointer"
            >
              <span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  isChecked
                    ? "border-[#95E1B0] bg-[#95E1B0] text-white"
                    : "border-[#2D3142]/20 bg-white text-transparent"
                }`}
              >
                <Check className="size-3" />
              </span>
              <span
                className={`text-xs leading-relaxed ${
                  isChecked ? "text-[#646B82]/70 line-through" : "text-[#2D3142]/85"
                }`}
              >
                {item}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const widgetClass = (id: WidgetId) =>
    `relative flex size-12 items-center justify-center rounded-2xl border transition-colors cursor-pointer ${
      openWidget === id
        ? "border-[#5B8DEF]/30 bg-[#E8F0FE] text-[#3E6FD6]"
        : "border-[#2D3142]/8 bg-white text-[#646B82] hover:bg-[#F3EFE6]"
    }`;

  const widgets = (
    <>
      <button
        type="button"
        aria-label={`Roteiro deste passo, ${checked.size} de ${step.walkthrough.length} itens feitos`}
        aria-expanded={openWidget === "walkthrough"}
        title="Roteiro"
        onClick={() => setOpenWidget((w) => (w === "walkthrough" ? null : "walkthrough"))}
        className={widgetClass("walkthrough")}
      >
        <ListCheck className="size-5" />
        <span className="absolute inset-x-3 bottom-2 h-0.5 overflow-hidden rounded-full bg-[#2D3142]/10">
          <span
            className={`absolute inset-0 origin-left rounded-full transition-transform duration-300 ease-out ${
              checked.size === step.walkthrough.length ? "bg-[#95E1B0]" : "bg-[#5B8DEF]"
            }`}
            style={{ transform: `scaleX(${step.walkthrough.length ? checked.size / step.walkthrough.length : 0})` }}
          />
        </span>
      </button>
      <button
        type="button"
        aria-label="Entrega deste passo"
        aria-expanded={openWidget === "deliverable"}
        title="Entrega"
        onClick={() => setOpenWidget((w) => (w === "deliverable" ? null : "deliverable"))}
        className={widgetClass("deliverable")}
      >
        <Target className="size-5" />
      </button>
    </>
  );

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
    <aside className="relative order-1 flex gap-2.5 lg:order-3 lg:sticky lg:top-6 lg:flex-col">
      {widgets}
      {openWidget === "walkthrough" && (
        <SidePanel
          title="Roteiro deste passo"
          icon={<ListCheck className="size-4 text-[#646B82]" />}
          onClose={() => setOpenWidget(null)}
        >
          {walkthroughList}
        </SidePanel>
      )}
      {openWidget === "deliverable" && (
        <SidePanel
          title="Entrega deste passo"
          icon={<Target className="size-4 text-[#646B82]" />}
          onClose={() => setOpenWidget(null)}
        >
          <p className="px-1 text-xs leading-relaxed text-[#2D3142]">
            {step.deliverable}
          </p>
        </SidePanel>
      )}
    </aside>
    <div className="order-3 min-w-0 flex-1 space-y-6 rounded-3xl border border-[#2D3142]/8 bg-white lg:order-1 px-5 py-6 sm:px-7 sm:py-8">
      <header className="space-y-4">
        <StepTrail stepIndex={stepIndex} totalSteps={totalSteps} />

        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium tabular-nums text-[#646B82]">
            {ToolIcon && <ToolIcon className="size-4" />}
            <span>
              {tool?.label} · {PHASE_LABEL[step.phase]} · ~{step.estimatedMinutes} min
            </span>
          </p>
          <h2 className="font-display text-xl font-medium leading-snug tracking-tight text-[#2D3142]">
            {step.title}
          </h2>
          <p className="max-w-[68ch] text-sm leading-relaxed text-[#646B82]">
            {step.objective}
          </p>
        </div>
      </header>

      <div>{children}</div>

      <footer className="flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F3EFE6] px-4 py-2.5 text-xs font-semibold text-[#646B82] transition-colors hover:bg-[#eae4d7] cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Voltar</span>
          </button>
        ) : (
          <span />
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
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
