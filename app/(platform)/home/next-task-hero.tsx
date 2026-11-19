"use client";

import Link from "next/link";
import {
  Clock,
  Play,
  Lock,
  CircleCheck,
  Video,
  ListCheck,
  Code,
  BookOpen,
} from "@gravity-ui/icons";
import { MascotBee } from "@/app/components/mascot-bee";
import {
  formatWeekdayAndDatePt,
  type ResolvedNextTask,
} from "@/lib/plan-structure";

interface NextTaskHeroProps {
  nextTask: ResolvedNextTask | null;
  completedToday: boolean;
  onStartSession: () => void;
}

const TOOL_LABELS: Record<string, { label: string; icon: typeof Video }> = {
  youtube_video: { label: "Vídeo guiado", icon: Video },
  practice_checklist: { label: "Checklist prática", icon: ListCheck },
  code_sandbox: { label: "Prática em código", icon: Code },
  markdown_math: { label: "Notas & fórmulas", icon: BookOpen },
};

export function NextTaskHero({
  nextTask,
  completedToday,
  onStartSession,
}: NextTaskHeroProps) {
  // Empty State: nenhum plano ativo
  if (!nextTask) {
    return (
      <section className="rounded-3xl bg-[#FFF0E5]/70 border border-[#FF9B85]/25 px-6 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row items-center gap-6">
        <MascotBee pose="curious" className="h-24 w-28 shrink-0" />
        <div className="space-y-3 text-center sm:text-left">
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#2D3142] tracking-tight">
            O que você quer aprender agora?
          </h1>
          <p className="text-sm sm:text-base text-[#646B82] max-w-[54ch]">
            Crie um plano moldado à sua rotina real e transforme sua meta em sessões claras no calendário.
          </p>
          <div className="pt-1">
            <Link
              href="/primeiro-plano"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF9B85] hover:bg-[#f28972] text-white font-semibold text-sm px-6 py-3 transition-colors cursor-pointer"
            >
              Criar meu plano
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { task, planTitle, planId, isTodayOrPast, isUnlocked, isEnriched } = nextTask;
  const duration = task.schedule?.durationMinutes ?? 30;
  const consumeMin = task.schedule?.timeBreakdown?.consumeMinutes;
  const practiceMin = task.schedule?.timeBreakdown?.practiceMinutes;
  const tools = task.pedagogy?.requiredTools ?? [];

  // Estado 4: Sessão de hoje concluída e próxima é futura
  if (completedToday && !isTodayOrPast) {
    return (
      <section className="space-y-4">
        <div className="rounded-3xl bg-[#95E1B0]/20 border border-[#95E1B0]/50 px-6 py-6 sm:px-8 flex flex-col sm:flex-row items-center gap-5">
          <MascotBee pose="celebrating" className="h-20 w-24 shrink-0" />
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2B6E47]">
              <CircleCheck className="size-4" />
              <span>Sessão de hoje concluída</span>
            </div>
            <h1 className="font-display text-2xl font-medium text-[#2D3142]">
              Excelente ritmo hoje!
            </h1>
            <p className="text-sm text-[#646B82] max-w-[56ch]">
              Sua próxima sessão já está reservada no calendário. Descanse e volte no próximo horário.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F3EFE6] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-medium text-[#646B82] truncate">
              Próxima sessão · {planTitle}
            </p>
            <p className="font-display text-base font-medium text-[#2D3142] truncate">
              {task.title}
            </p>
            <p className="text-xs text-[#646B82] tabular-nums">
              {formatWeekdayAndDatePt(task.schedule.date)} às {task.schedule.startTime} · {duration} min
            </p>
          </div>
          <Link
            href={`/planos/${planId}`}
            className="text-xs font-semibold text-[#5B8DEF] hover:underline shrink-0 cursor-pointer"
          >
            Ver plano completo
          </Link>
        </div>
      </section>
    );
  }

  // Estado 3: Próxima sessão futura (bloqueada)
  if (!isTodayOrPast || !isUnlocked) {
    return (
      <section className="rounded-3xl bg-[#F3EFE6] border border-[#2D3142]/8 px-6 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#646B82]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[#2D3142] tabular-nums">
                <Lock className="size-3.5 text-[#646B82]" />
                <span>
                  Desbloqueia {formatWeekdayAndDatePt(task.schedule.date)} às {task.schedule.startTime}
                </span>
              </span>
              <span className="tabular-nums">{duration} min</span>
            </div>

            <p className="text-xs font-medium text-[#646B82] truncate">{planTitle}</p>

            <h1 className="font-display text-2xl sm:text-[28px] leading-snug font-medium text-[#2D3142]">
              {task.title}
            </h1>

            <p className="text-sm sm:text-[15px] leading-relaxed text-[#646B82] max-w-[65ch]">
              {task.whyItMatters}
            </p>
          </div>

          <MascotBee pose="sleepy" className="h-20 w-24 shrink-0 self-center sm:self-start" />
        </div>
      </section>
    );
  }

  // Estado 2: Preparando conteúdo (hoje, mas enriquecimento ainda não concluído)
  if (!isEnriched) {
    return (
      <section className="rounded-3xl bg-white border border-[#5B8DEF]/25 px-6 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0FE] text-[#5B8DEF] px-3 py-1 tabular-nums">
                <Clock className="size-3.5" />
                <span>
                  Hoje às {task.schedule.startTime} · {duration} min
                </span>
              </span>
            </div>

            <p className="text-xs font-medium text-[#646B82] truncate">{planTitle}</p>

            <h1 className="font-display text-2xl sm:text-[28px] leading-snug font-medium text-[#2D3142]">
              {task.title}
            </h1>

            <p className="text-sm sm:text-[15px] leading-relaxed text-[#646B82] max-w-[65ch]">
              {task.whyItMatters}
            </p>

            <div className="pt-2">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-2xl bg-[#F3EFE6] text-[#646B82] font-semibold text-sm px-6 py-3.5 cursor-not-allowed"
              >
                Preparando sua sessão...
              </button>
            </div>
          </div>

          <MascotBee pose="curious" className="h-20 w-24 shrink-0 self-center sm:self-start" />
        </div>
      </section>
    );
  }

  // Estado 1: Sessão de hoje (pronta)
  return (
    <section className="rounded-3xl bg-white border border-[#5B8DEF]/25 px-6 py-7 sm:px-8 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="space-y-3.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0FE] text-[#5B8DEF] px-3 py-1 tabular-nums">
              <Clock className="size-3.5" />
              <span>
                Hoje às {task.schedule.startTime} · {duration} min
              </span>
            </span>
            {typeof consumeMin === "number" && typeof practiceMin === "number" && (
              <span className="text-[#646B82] tabular-nums">
                {consumeMin} min consumo · {practiceMin} min prática
              </span>
            )}
          </div>

          <p className="text-xs font-medium text-[#646B82] truncate">{planTitle}</p>

          <h1 className="font-display text-2xl sm:text-[30px] leading-snug font-medium text-[#2D3142]">
            {task.title}
          </h1>

          <p className="text-sm sm:text-[15px] leading-relaxed text-[#646B82] max-w-[65ch]">
            {task.whyItMatters}
          </p>

          {tools.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {tools.map((tool) => {
                const meta = TOOL_LABELS[tool];
                if (!meta) return null;
                const ToolIcon = meta.icon;
                return (
                  <span
                    key={tool}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#F3EFE6]/80 px-2.5 py-1 text-xs font-medium text-[#2D3142]"
                  >
                    <ToolIcon className="size-3.5 text-[#5B8DEF]" />
                    <span>{meta.label}</span>
                  </span>
                );
              })}
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onStartSession}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF9B85] hover:bg-[#f28972] text-white font-semibold text-sm sm:text-base px-7 py-3.5 transition-colors cursor-pointer"
            >
              <Play className="size-4" />
              <span>Começar sessão</span>
            </button>
          </div>
        </div>

        <MascotBee pose="focus" className="h-24 w-28 shrink-0 self-center sm:self-start" />
      </div>
    </section>
  );
}
