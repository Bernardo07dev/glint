"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronsCollapseUpRight,
  ChevronsExpandUpRight,
  CircleCheck,
  CircleQuestion,
  Compass,
  Flag,
  LayoutSideContentLeft,
  Target,
  Video,
} from "@gravity-ui/icons";
import { MascotBee } from "@/app/components/mascot-bee";
import { BeeHelperPanel, type BeeMessage } from "./bee-helper-panel";
import type { LiveQuizState } from "./recall-quiz";
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

type LeftTab = "roadmap" | "bee";
type MobilePane = "content" | "roadmap";

interface SessionStepProps {
  planId: string;
  taskKey: string;
  taskTitle: string;
  step: SessionStepData;
  stepIndex: number;
  totalSteps: number;
  quizState?: LiveQuizState;
  children: ReactNode;
  onSelectStep?: (index: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextPrimary?: boolean;
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
  const progressRatio = totalSteps > 1 ? stepIndex / (totalSteps - 1) : 1;
  // Borda progressiva vertical da pill: começa abraçando o 1º passo e chega a 100% no último
  const borderFillPct =
    totalSteps > 1 ? Math.round(18 + progressRatio * 82) : 100;

  return (
    <div className="relative inline-flex flex-col items-center overflow-hidden rounded-full bg-[#2D3142]/10 p-[2px]">
      {/* Borda azul vertical com degradê suave na ponta (fecha sólida em 100%) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 transition-[height] duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
        style={{
          height: `${borderFillPct}%`,
          background:
            borderFillPct >= 100
              ? "#5B8DEF"
              : "linear-gradient(180deg, #5B8DEF 0%, #5B8DEF 76%, rgba(91,141,239,0) 100%)",
        }}
      />

      <div className="relative z-10 inline-flex w-9 flex-col items-center gap-3 rounded-full bg-[#F3EFE6] py-3.5">
        <div
          className="relative flex h-36 w-6 flex-col items-center justify-between"
          role="progressbar"
          aria-label="Progresso da sessão"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={stepIndex + 1}
        >
          {/* Trilha base vertical arredondada */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-2.5 left-1/2 w-1 -translate-x-1/2 rounded-full bg-[#2D3142]/10"
          />

          {/* Preenchimento azul vertical animado (sobe e desce suavemente) */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-2.5 left-1/2 w-1 -translate-x-1/2 rounded-full bg-[#5B8DEF] transition-[height] duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
            style={{ height: `calc((100% - 20px) * ${progressRatio})` }}
          />

          {/* Nós clicáveis dos steps */}
          {Array.from({ length: totalSteps }).map((_, i) => {
            const isCurrent = i === stepIndex;
            const isPast = i < stepIndex;

            const nodeVisual = (
              <span
                className={`flex size-3.5 items-center justify-center rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "scale-0 opacity-0"
                    : isPast
                      ? "bg-[#95E1B0] text-[#1F5134]"
                      : "border border-[#2D3142]/15 bg-white"
                }`}
              >
                {isPast && <Check className="size-2.5 stroke-[3]" />}
              </span>
            );

            if (onSelectStep) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectStep(i)}
                  aria-label={`Ir para o passo ${i + 1}`}
                  aria-current={isCurrent ? "step" : undefined}
                  title={`Passo ${i + 1}`}
                  className="relative z-10 flex size-5 items-center justify-center rounded-full transition-transform hover:scale-115 cursor-pointer"
                >
                  {nodeVisual}
                </button>
              );
            }

            return (
              <span
                key={i}
                className="relative z-10 flex size-5 items-center justify-center"
              >
                {nodeVisual}
              </span>
            );
          })}

          {/* Abelhinha deslizando verticalmente entre os steps */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 z-20 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#5B8DEF]/30 bg-[#FFFDF8] shadow-[0_2px_8px_rgba(45,49,66,0.10)] transition-[top] duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
            style={{
              top: `calc(10px + (100% - 20px) * ${progressRatio})`,
            }}
          >
            <MascotBee pose="standard" className="h-5 w-6 shrink-0" />
          </span>
        </div>

        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-[#646B82]">
          {stepIndex + 1}/{totalSteps}
        </span>
      </div>
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
  planId,
  taskKey,
  taskTitle,
  step,
  stepIndex,
  totalSteps,
  quizState,
  children,
  onSelectStep,
  onBack,
  onNext,
  nextLabel = "Próximo passo",
  nextPrimary = true,
}: SessionStepProps) {
  const [checkedByStep, setCheckedByStep] = useState<
    Record<string, Set<number>>
  >({});
  const checked = checkedByStep[step.id] ?? new Set<number>();
  const [leftTab, setLeftTab] = useState<LeftTab>("roadmap");
  const [mobilePane, setMobilePane] = useState<MobilePane>("content");
  const [mobileBeeOpen, setMobileBeeOpen] = useState(false);
  const [beeMessages, setBeeMessages] = useState<BeeMessage[]>([]);

  // Largura redimensionável do painel esquerdo (%) + colapso / modo tela cheia
  const [leftWidthPct, setLeftWidthPct] = useState(38);
  const [isDragging, setIsDragging] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [contentFullscreen, setContentFullscreen] = useState(false);
  const [browserFullscreen, setBrowserFullscreen] = useState(false);

  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  const tool = TOOL_META[step.toolRef];
  const ToolIcon = tool?.icon;

  const totalWalkthrough = step.walkthrough.length;
  const completedWalkthrough = checked.size;
  const allWalkthroughDone =
    totalWalkthrough > 0 && completedWalkthrough === totalWalkthrough;

  const toggle = (i: number) =>
    setCheckedByStep((prev) => {
      const current = new Set(prev[step.id] ?? []);
      if (current.has(i)) current.delete(i);
      else current.add(i);
      return { ...prev, [step.id]: current };
    });

  // Drag handle estilo LeetCode para redimensionar as colunas
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = splitContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const rawPct = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(62, Math.max(24, rawPct));
      setLeftWidthPct(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Sincroniza estado do Fullscreen nativo do navegador
  useEffect(() => {
    const onFsChange = () => {
      setBrowserFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleBrowserFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback caso o browser bloqueie Fullscreen API
      setContentFullscreen((prev) => !prev);
    }
  }, []);

  const roadmapAndGoalsSection = (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5">
      {/* Cabeçalho do passo dentro dos assets */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {ToolIcon && (
            <span
              title={tool?.label}
              aria-label={tool?.label}
              className="inline-flex size-6 items-center justify-center rounded-lg bg-[#F3EFE6] text-[#646B82]"
            >
              <ToolIcon className="size-3.5" />
            </span>
          )}
          <span className="rounded-lg bg-[#F3EFE6] px-2.5 py-1 text-xs font-medium text-[#646B82]">
            {PHASE_LABEL[step.phase]}
          </span>
          <span className="rounded-lg bg-[#FFE07D]/45 px-2.5 py-1 text-xs font-semibold tabular-nums text-[#2D3142]">
            ~{step.estimatedMinutes} min
          </span>
        </div>

        <h2 className="font-display text-lg sm:text-xl font-medium leading-snug text-[#2D3142]">
          {step.title}
        </h2>
      </div>

      {/* Cards de Objetivo e Entregável (Goals & Metas) */}
      <div className="grid grid-cols-1 gap-2.5">
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
            <span>Meta de entrega</span>
          </p>
          <p className="text-xs leading-[1.6] text-[#2D3142]/85">
            {step.deliverable}
          </p>
        </div>
      </div>

      {/* Checklist do Passo a Passo */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass
              className={`size-4 ${
                allWalkthroughDone ? "text-[#2B6E47]" : "text-[#5B8DEF]"
              }`}
            />
            <h3 className="text-sm text-[#2D3142]">
              Passo a Passo
            </h3>
          </div>

          {(() => {
            const pct =
              totalWalkthrough > 0
                ? Math.round((completedWalkthrough / totalWalkthrough) * 100)
                : 0;
            const ringColor = allWalkthroughDone ? "#95E1B0" : "#5B8DEF";
            return (
              <div
                className="inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-[#646B82]"
                title={`${completedWalkthrough} de ${totalWalkthrough} concluídos`}
              >
                <span
                  aria-hidden="true"
                  className="relative flex size-4 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(${ringColor} ${pct}%, #E5E0D5 0)`,
                  }}
                >
                  <span className="size-2.5 rounded-full bg-white" />
                </span>
                <span>
                  {completedWalkthrough}/{totalWalkthrough}
                </span>
              </div>
            );
          })()}
        </div>

        <ol className="space-y-1">
          {step.walkthrough.map((item, i) => {
            const isChecked = checked.has(i);
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className={`group flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left transition-colors cursor-pointer ${
                    isChecked
                      ? "opacity-75 hover:bg-[#F3EFE6]/40"
                      : "hover:bg-[#F3EFE6]/55"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
                      isChecked
                        ? "border-[#95E1B0] bg-[#95E1B0] text-[#1F5134]"
                        : "border-[#2D3142]/20 bg-white group-hover:border-[#5B8DEF]"
                    }`}
                  >
                    {isChecked && <Check className="size-2.5 stroke-[3]" />}
                  </span>
                  <span
                    className={`flex-1 text-[13px] leading-[1.55] ${
                      isChecked
                        ? "text-[#646B82] line-through decoration-[#646B82]/40"
                        : "text-[#2D3142]/90"
                    }`}
                  >
                    {formatWalkthroughItem(item)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );

  const showLeftColumn = !leftCollapsed && !contentFullscreen;

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#F3EFE6]/65 text-[#2D3142]">
      {/* TOP BAR ESTILO LEETCODE */}
      <header className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-[#2D3142]/10 bg-[#FFFDF8] px-3 sm:px-4">
        {/* Esquerda: Voltar + Título da Task + Toggle da coluna esquerda */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={`/planos/${planId}`}
            title="Voltar ao plano"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F3EFE6] px-2.5 py-1.5 text-xs font-semibold text-[#2D3142]/85 transition-colors hover:bg-[#EAE4D7] cursor-pointer"
          >
            <ArrowLeft className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">Plano</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              if (contentFullscreen) {
                setContentFullscreen(false);
                setLeftCollapsed(false);
              } else {
                setLeftCollapsed((prev) => !prev);
              }
            }}
            title={
              showLeftColumn
                ? "Recolher painel de metas e Bee IA"
                : "Mostrar painel de metas e Bee IA"
            }
            aria-label="Alternar painel lateral de metas e IA"
            className={`hidden lg:inline-flex items-center justify-center size-8 rounded-xl border transition-colors cursor-pointer ${
              showLeftColumn
                ? "border-[#5B8DEF]/30 bg-[#E8F0FE] text-[#3E6FD6]"
                : "border-[#2D3142]/10 bg-white text-[#646B82] hover:bg-[#F3EFE6]"
            }`}
          >
            <LayoutSideContentLeft className="size-4" />
          </button>

          <div className="h-4 w-px bg-[#2D3142]/10 hidden sm:block" />

          <h1
            className="truncate font-display text-sm sm:text-base font-semibold tracking-tight text-[#2D3142] max-w-[24ch] sm:max-w-[38ch] xl:max-w-[52ch]"
            title={taskTitle}
          >
            {taskTitle}
          </h1>
        </div>

        {/* Direita: Controles de Passo + Modo Tela Cheia */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Passo anterior"
              aria-label="Passo anterior"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#F3EFE6] px-2.5 py-1.5 sm:px-3 text-xs font-semibold text-[#2D3142]/85 transition-colors hover:bg-[#eae4d7] cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
          )}

          <span className="sm:hidden shrink-0 px-1 text-xs font-semibold tabular-nums text-[#646B82]">
            {stepIndex + 1}/{totalSteps}
          </span>

          {onNext && (
            <button
              type="button"
              onClick={onNext}
              title={nextLabel}
              aria-label={nextLabel}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 sm:px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
                nextPrimary
                  ? "bg-[#FF9B85] text-white hover:bg-[#f28972]"
                  : "bg-[#F3EFE6] text-[#646B82] hover:bg-[#eae4d7]"
              }`}
            >
              <span className="hidden sm:inline">{nextLabel}</span>
              {stepIndex + 1 < totalSteps ? (
                <ArrowRight className="size-3.5" />
              ) : (
                <CircleCheck className="size-3.5" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => void toggleBrowserFullscreen()}
            title={
              browserFullscreen ? "Sair da tela cheia (F11)" : "Modo Tela Cheia"
            }
            aria-label={
              browserFullscreen ? "Sair da tela cheia" : "Ativar Modo Tela Cheia"
            }
            className={`hidden lg:inline-flex size-8 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
              browserFullscreen
                ? "border-[#5B8DEF]/35 bg-[#E8F0FE] text-[#3E6FD6]"
                : "border-[#2D3142]/10 bg-white text-[#646B82] hover:bg-[#F3EFE6] hover:text-[#2D3142]"
            }`}
          >
            {browserFullscreen ? (
              <ChevronsCollapseUpRight className="size-4" />
            ) : (
              <ChevronsExpandUpRight className="size-4" />
            )}
          </button>
        </div>
      </header>

      {/* Sub-barra Mobile (< lg): Seletor de Painel em 2 abas (Metas | Conteúdo) */}
      <div className="flex lg:hidden shrink-0 items-center border-b border-[#2D3142]/10 bg-[#FFFDF8] px-3 py-2">
        <div className="grid w-full grid-cols-2 gap-1 rounded-xl bg-[#F3EFE6] p-1">
          <button
            type="button"
            onClick={() => setMobilePane("roadmap")}
            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              mobilePane === "roadmap"
                ? "bg-white text-[#2D3142] shadow-xs"
                : "text-[#646B82]"
            }`}
          >
            <Compass className="size-3.5 shrink-0 text-[#5B8DEF]" />
            <span>
              Metas {completedWalkthrough}/{totalWalkthrough}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobilePane("content")}
            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              mobilePane === "content"
                ? "bg-white text-[#2D3142] shadow-xs"
                : "text-[#646B82]"
            }`}
          >
            {ToolIcon && <ToolIcon className="size-3.5 shrink-0 text-[#5B8DEF]" />}
            <span>Conteúdo</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE SPLIT-SCREEN (ESTILO LEETCODE) */}
      <div
        ref={splitContainerRef}
        className={`relative flex flex-1 min-h-0 w-full gap-0 p-2 sm:p-2.5 ${
          isDragging ? "select-none cursor-col-resize" : ""
        }`}
      >
        {/* MINI-SIDEBAR FLUTUANTE QUANDO O PAINEL ESQUERDO ESTÁ RECOLHIDO (DESKTOP) */}
        <div
          aria-hidden={showLeftColumn}
          className={`hidden lg:flex flex-col items-center gap-2 self-start rounded-2xl border border-[#2D3142]/10 bg-white/95 p-1.5 shadow-[0_8px_24px_-10px_rgba(45,49,66,0.18)] backdrop-blur transition-all duration-300 ease-out ${
            showLeftColumn
              ? "w-0 overflow-hidden border-0 p-0 opacity-0 pointer-events-none mr-0"
              : "w-12 opacity-100 mr-2.5"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setContentFullscreen(false);
              setLeftCollapsed(false);
              setLeftTab("roadmap");
            }}
            title={`Abrir Objetivo e Passo a Passo (${completedWalkthrough}/${totalWalkthrough})`}
            aria-label="Abrir Objetivo e Passo a Passo"
            className="relative flex size-9 items-center justify-center rounded-xl text-[#646B82] transition-colors hover:bg-[#E8F0FE] hover:text-[#3E6FD6] cursor-pointer"
          >
            <Compass className="size-4.5" />
            <span className="absolute inset-x-2 bottom-1 h-0.5 overflow-hidden rounded-full bg-[#2D3142]/10">
              <span
                className={`block h-full origin-left rounded-full transition-transform duration-300 ${
                  allWalkthroughDone ? "bg-[#95E1B0]" : "bg-[#5B8DEF]"
                }`}
                style={{
                  transform: `scaleX(${
                    totalWalkthrough > 0
                      ? completedWalkthrough / totalWalkthrough
                      : 0
                  })`,
                }}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setContentFullscreen(false);
              setLeftCollapsed(false);
              setLeftTab("bee");
            }}
            title="Abrir Bee IA"
            aria-label="Abrir Bee IA"
            className="relative flex size-9 items-center justify-center rounded-full border border-[#2D3142]/10 bg-[#FFFDF8] transition-colors hover:border-[#5B8DEF]/40 hover:bg-[#E8F0FE]/60 cursor-pointer"
          >
            <MascotBee pose="curious" className="h-5 w-6 shrink-0" />
            {beeMessages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#5B8DEF]" />
            )}
          </button>
        </div>

        {/* PAINEL ESQUERDO: ASSETS (GOALS, METAS, ROTEIRO) + BEE IA */}
        <aside
          aria-label="Metas, roteiro e Bee IA"
          aria-hidden={!showLeftColumn}
          style={{ width: showLeftColumn ? `${leftWidthPct}%` : "0%" }}
          className={`flex-col overflow-hidden rounded-2xl bg-white ${
            isDragging
              ? ""
              : "transition-[width,min-width,max-width,opacity,border-width] duration-300 ease-out"
          } ${
            showLeftColumn
              ? "border border-[#2D3142]/10 shadow-2xs lg:min-w-[320px] lg:max-w-[640px] lg:opacity-100"
              : "lg:min-w-0 lg:max-w-0 lg:border-0 lg:opacity-0 lg:pointer-events-none"
          } ${
            mobilePane === "roadmap"
              ? "flex w-full! lg:w-auto!"
              : "hidden lg:flex"
          }`}
        >
            {/* Header de Abas do Painel Esquerdo */}
            <div className="hidden lg:flex h-11 shrink-0 items-center gap-2.5 border-b border-[#2D3142]/8 bg-[#FFFDF8] px-3.5">
              <button
                type="button"
                onClick={() => setLeftTab("roadmap")}
                title="Objetivo e Passo a Passo"
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  leftTab === "roadmap"
                    ? "bg-[#E8F0FE] text-[#3E6FD6]"
                    : "text-[#646B82] hover:bg-[#F3EFE6]/70 hover:text-[#2D3142]"
                }`}
              >
                <Compass className="size-3.5" />
                <span>Objetivo e Passo a Passo</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab("bee")}
                title="Bee IA"
                aria-label="Abrir Bee IA"
                className={`relative flex size-8 items-center justify-center rounded-full border transition-colors cursor-pointer ${
                  leftTab === "bee"
                    ? "border-[#5B8DEF] bg-[#E8F0FE]"
                    : "border-[#2D3142]/12 bg-white hover:border-[#5B8DEF]/40 hover:bg-[#E8F0FE]/50"
                }`}
              >
                <MascotBee
                  pose={leftTab === "bee" ? "focus" : "curious"}
                  className="h-5 w-6 shrink-0"
                />
                {beeMessages.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#5B8DEF]" />
                )}
              </button>
            </div>

            {/* Corpo do Painel Esquerdo (Desktop: segue leftTab | Mobile: segue mobilePane) */}
            <div className="flex flex-1 min-h-0 flex-col">
              {/* Desktop view */}
              <div className="hidden lg:flex flex-1 min-h-0 flex-col">
                {leftTab === "roadmap" && roadmapAndGoalsSection}

                {leftTab === "bee" && (
                  <BeeHelperPanel
                    embedded
                    planId={planId}
                    taskKey={taskKey}
                    stepId={step.id}
                    totalWalkthrough={totalWalkthrough}
                    toolRef={step.toolRef}
                    checkedWalkthroughIndices={Array.from(checked)}
                    quizState={quizState}
                    messages={beeMessages}
                    onMessagesChange={setBeeMessages}
                  />
                )}
              </div>

              {/* Mobile view */}
              <div className="flex lg:hidden flex-1 min-h-0 flex-col">
                {mobilePane === "roadmap" && roadmapAndGoalsSection}
              </div>
            </div>
          </aside>

        {/* DIVISOR REDIMENSIONÁVEL (RESIZE HANDLE ESTILO LEETCODE) */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar painéis"
          onMouseDown={() => showLeftColumn && setIsDragging(true)}
          onDoubleClick={() => showLeftColumn && setLeftWidthPct(38)}
          title="Arraste para redimensionar (duplo clique para resetar)"
          className={`group hidden lg:flex shrink-0 items-center justify-center transition-[width,opacity] duration-300 ease-out ${
            showLeftColumn
              ? "w-2.5 cursor-col-resize opacity-100"
              : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          <span
            className={`h-12 w-1 rounded-full transition-colors ${
              isDragging
                ? "bg-[#5B8DEF]"
                : "bg-[#2D3142]/12 group-hover:bg-[#5B8DEF]"
            }`}
          />
        </div>

        {/* PAINEL DIREITO: CONTEÚDO PRINCIPAL (VÍDEO, GUIA OU QUIZ) */}
        <section
          aria-label="Conteúdo do passo"
          className={`flex-1 min-w-0 min-h-0 flex-col overflow-hidden rounded-2xl border border-[#2D3142]/10 bg-white shadow-2xs ${
            mobilePane === "content" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Barra superior do Painel Direito */}
          <div className="flex h-12 shrink-0 items-center justify-between gap-3 px-4 pt-1">
            <div className="flex min-w-0 items-center gap-2">
              {ToolIcon && (
                <span
                  title={tool?.label}
                  aria-label={tool?.label}
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#F3EFE6] text-[#646B82]"
                >
                  <ToolIcon className="size-3.5" />
                </span>
              )}
              <span className="truncate font-display text-sm font-medium text-[#2D3142]">
                {step.title}
              </span>
            </div>
          </div>

          {/* Palco com scroll na extrema direita e StepTrail vertical sempre visível */}
          <div className="relative flex-1 min-h-0">
            <div className="h-full overflow-y-auto px-5 py-6 sm:px-8 sm:py-7 md:pr-16 lg:px-10 lg:pr-18">
              <div className="mx-auto w-full max-w-5xl">{children}</div>
            </div>

            <div className="pointer-events-none hidden md:flex absolute right-4 top-1/2 z-20 -translate-y-1/2 items-center">
              <div className="pointer-events-auto">
                <StepTrail
                  stepIndex={stepIndex}
                  totalSteps={totalSteps}
                  onSelectStep={onSelectStep}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Botão flutuante circular da Bee no Mobile (< lg) */}
      <button
        type="button"
        onClick={() => setMobileBeeOpen((prev) => !prev)}
        aria-label="Tirar dúvida com a Bee"
        aria-expanded={mobileBeeOpen}
        className={`fixed right-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full border-2 shadow-[0_8px_24px_-6px_rgba(45,49,66,0.22)] transition-transform active:scale-95 cursor-pointer lg:hidden ${
          mobileBeeOpen
            ? "border-[#5B8DEF] bg-[#E8F0FE]"
            : "border-[#5B8DEF]/25 bg-white hover:bg-[#E8F0FE]"
        }`}
      >
        <MascotBee
          pose={mobileBeeOpen ? "focus" : "curious"}
          className="h-10 w-11"
        />
        {beeMessages.length > 0 && !mobileBeeOpen && (
          <span className="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-[#5B8DEF] ring-2 ring-white" />
        )}
      </button>

      {/* Bottom sheet da Bee no Mobile (< lg) */}
      {mobileBeeOpen && (
        <div className="lg:hidden">
          <BeeHelperPanel
            planId={planId}
            taskKey={taskKey}
            stepId={step.id}
            totalWalkthrough={totalWalkthrough}
            toolRef={step.toolRef}
            checkedWalkthroughIndices={Array.from(checked)}
            quizState={quizState}
            messages={beeMessages}
            onMessagesChange={setBeeMessages}
            onClose={() => setMobileBeeOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
