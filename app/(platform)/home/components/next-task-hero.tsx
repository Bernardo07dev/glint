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
              Excelente ritmo hoje
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
      <section className="rounded-3xl bg-white border border-[#5B8DEF]/25 overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 text-xs tabular-nums">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F0FE] px-3 py-1.5 font-semibold text-[#5B8DEF]">
                <Lock className="size-3.5" />
                <span>Agendada</span>
              </span>
              <span className="font-semibold text-[#646B82]/90">
                {formatWeekdayAndDatePt(task.schedule.date)} às {task.schedule.startTime} · {duration} min
              </span>
            </div>

            <h1 className="font-display text-xl sm:text-[22px] leading-snug font-medium text-[#2D3142]">
              {task.title}
            </h1>

            <p className="font-sans font-medium text-xs sm:text-sm leading-relaxed text-[#2D3142]/70 max-w-[60ch]">
              {task.whyItMatters}
            </p>
          </div>

          <MascotBee
            pose="sleepy"
            className="hidden sm:block h-20 w-24 shrink-0"
          />
        </div>

        <div className="bg-[#F3EFE6]/55 border-t border-[#5B8DEF]/15 px-6 py-3.5 sm:px-8 flex items-center justify-between gap-4">
          <p className="font-sans font-medium text-xs text-[#2D3142]/65 truncate">
            {planTitle}
          </p>
          <Link
            href={`/planos/${planId}`}
            className="font-sans text-xs font-semibold text-[#5B8DEF] hover:underline shrink-0 cursor-pointer"
          >
            Ver plano
          </Link>
        </div>
      </section>
    );
  }

  // Estado 2: Preparando conteúdo (hoje, mas enriquecimento ainda não concluído)
  if (!isEnriched) {
    return (
      <section className="rounded-3xl bg-white border border-[#5B8DEF]/25 overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 text-xs tabular-nums">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F0FE] px-3 py-1.5 font-semibold text-[#5B8DEF]">
                <Clock className="size-3.5" />
                <span>Hoje</span>
              </span>
              <span className="font-semibold text-[#646B82]/90">
                às {task.schedule.startTime} · {duration} min
              </span>
            </div>

            <h1 className="font-display text-xl sm:text-[22px] leading-snug font-medium text-[#2D3142]">
              {task.title}
            </h1>

            <p className="font-sans font-medium text-xs sm:text-sm leading-relaxed text-[#2D3142]/70 max-w-[60ch]">
              {task.whyItMatters}
            </p>
          </div>

          <MascotBee
            pose="curious"
            className="hidden sm:block h-20 w-24 shrink-0"
          />
        </div>

        <div className="bg-[#F3EFE6]/55 border-t border-[#5B8DEF]/15 px-6 py-4 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="font-sans font-medium text-xs text-[#2D3142]/65 truncate">
            {planTitle}
          </p>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F3EFE6] text-[#646B82] font-semibold text-xs px-5 py-2 cursor-not-allowed shrink-0"
          >
            Preparando sua sessão...
          </button>
        </div>
      </section>
    );
  }

  // Estado 1: Sessão de hoje (pronta)
  return (
    <section className="rounded-3xl bg-white border border-[#5B8DEF]/25 overflow-hidden">
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5 text-xs tabular-nums">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F0FE] text-[#5B8DEF] font-semibold px-3 py-1.5">
              <Clock className="size-3.5" />
              <span>Hoje às {task.schedule.startTime} · {duration} min</span>
            </span>
            {typeof consumeMin === "number" && typeof practiceMin === "number" && (
              <span className="font-semibold text-[#646B82]/90">
                {consumeMin} min consumo · {practiceMin} min prática
              </span>
            )}
          </div>

          <h1 className="font-display text-xl sm:text-[22px] leading-snug font-medium text-[#2D3142]">
            {task.title}
          </h1>

          <p className="font-sans font-medium text-xs sm:text-sm leading-relaxed text-[#2D3142]/70 max-w-[60ch]">
            {task.whyItMatters}
          </p>

          {tools.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {tools.map((tool) => {
                const meta = TOOL_LABELS[tool];
                if (!meta) return null;
                const ToolIcon = meta.icon;
                return (
                  <span
                    key={tool}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#F3EFE6]/70 px-2.5 py-1 text-xs font-medium text-[#2D3142]/80"
                  >
                    <ToolIcon className="size-3.5 text-[#5B8DEF]" />
                    <span>{meta.label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <MascotBee
          pose="focus"
          className="hidden sm:block h-24 w-28 shrink-0"
        />
      </div>

      <div className="bg-[#F3EFE6]/55 border-t border-[#5B8DEF]/15 px-6 py-4 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="font-sans font-medium text-xs text-[#2D3142]/65 truncate">
          {planTitle}
        </p>
        <Link
          href={`/planos/${planId}/tasks/${task.taskId}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF9B85] hover:bg-[#f28972] text-white font-semibold text-sm px-6 py-3 transition-colors cursor-pointer shrink-0"
        >
          <Play className="size-4" />
          <span>Começar sessão</span>
        </Link>
      </div>
    </section>
  );
}
