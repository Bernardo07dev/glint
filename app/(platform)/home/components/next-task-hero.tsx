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
  video: { label: "Vídeo guiado", icon: Video },
  concept_explainer: { label: "Guia do mentor", icon: BookOpen },
  active_recall_quiz: { label: "Quiz de fixação", icon: ListCheck },
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
      <section className="rounded-2xl bg-white/80 border border-[#2D3142]/8 px-6 py-7 sm:px-8 sm:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <MascotBee pose="curious" className="h-12 w-14 shrink-0" />
          <div className="space-y-0.5 min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-medium text-[#2D3142]">
              O que você quer aprender agora?
            </h1>
            <p className="text-xs sm:text-[13px] text-[#646B82] max-w-[46ch]">
              Crie um plano moldado à sua rotina e transforme sua meta em sessões claras.
            </p>
          </div>
        </div>
        <Link
          href="/primeiro-plano"
          className="inline-flex items-center justify-center rounded-xl bg-[#FF9B85] hover:bg-[#f28972] text-white font-semibold text-xs sm:text-sm px-4 py-2.5 transition-colors cursor-pointer shrink-0"
        >
          Criar meu plano
        </Link>
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

        <div className="rounded-2xl bg-white/75 border border-[#2D3142]/8 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className=" min-w-0">
            <p className="text-[11px] font-medium text-[#646B82]/80 truncate">
              Próxima sessão · {planTitle}
            </p>
            <p className="font-display text-[1.1rem] mb-1 font-medium text-[#2D3142] truncate">
              {task.title}
            </p>
            <p className="text-[11px] text-[#646B82]/80 tabular-nums">
              {formatWeekdayAndDatePt(task.schedule.date)} às {task.schedule.startTime} · {duration} min
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/planos/${planId}`}
              className="text-xs font-medium text-[#646B82] hover:text-[#2D3142] transition-colors cursor-pointer"
            >
              Ver plano
            </Link>
            <Link
              href={`/planos/${planId}/tasks/${task.taskId}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#E8F0FE] hover:bg-[#dce8fd] text-[#5B8DEF] font-semibold text-xs px-3.5 py-2 transition-colors cursor-pointer"
            >
              <Play className="size-3" />
              <span>Adiantar sessão</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Estado 3: Próxima sessão futura (bloqueada)
  if (!isUnlocked) {
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
      <section className="rounded-2xl bg-white/75 border border-[#2D3142]/8 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-medium text-[#646B82]/80 truncate">
            {planTitle}
          </p>
          <h1 className="font-display text-base sm:text-lg font-medium text-[#2D3142] leading-snug">
            {task.title}
          </h1>
          <p className="text-[11px] text-[#646B82]/80 tabular-nums">
            {isTodayOrPast ? "Hoje" : formatWeekdayAndDatePt(task.schedule.date)} às{" "}
            {task.schedule.startTime} · {duration} min
          </p>
        </div>

        <Link
          href={`/planos/${planId}/tasks/${task.taskId}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FF9B85] hover:bg-[#f28972] text-white font-semibold text-xs px-4 py-2.5 transition-colors cursor-pointer shrink-0"
        >
          <Play className="size-3.5" />
          <span>Preparar sessão</span>
        </Link>
      </section>
    );
  }

  // Estado 1: Sessão de hoje (pronta)
  return (
    <section className="rounded-2xl bg-white/75 border border-[#2D3142]/8 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <p className="text-[11px] font-medium text-[#646B82]/80 truncate">
          {planTitle}
        </p>
        <h1 className="font-display text-base sm:text-lg font-medium text-[#2D3142] leading-snug">
          {task.title}
        </h1>
        <p className="text-[11px] text-[#646B82]/80 tabular-nums">
          {isTodayOrPast ? "Hoje" : formatWeekdayAndDatePt(task.schedule.date)} às{" "}
          {task.schedule.startTime} · {duration} min
        </p>
      </div>

      <Link
        href={`/planos/${planId}/tasks/${task.taskId}`}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FF9B85] hover:bg-[#f28972] text-white font-semibold text-xs px-4 py-2.5 transition-colors cursor-pointer shrink-0"
      >
        <Play className="size-3.5" />
        <span>Começar sessão</span>
      </Link>
    </section>
  );
}
