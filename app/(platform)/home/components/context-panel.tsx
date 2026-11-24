"use client";

import { ArrowChevronRight, Calendar } from "@gravity-ui/icons";
import { MascotBee, type MascotBeePose } from "@/app/components/mascot-bee";
import type { ResolvedNextTask, WeeklyRhythm } from "@/lib/plan-structure";

interface ContextPanelProps {
  rhythm: WeeklyRhythm;
  nextTask: ResolvedNextTask | null;
  completedToday: boolean;
  onOpenReschedule: () => void;
}

export function MentorNote({
  nextTask,
  completedToday,
  className = "",
}: {
  nextTask: ResolvedNextTask | null;
  completedToday: boolean;
  className?: string;
}) {
  let mentorPose: MascotBeePose = "standard";
  let mentorNote = "Um passo curto por dia vale mais que maratonas esporádicas.";

  if (completedToday) {
    mentorPose = "celebrating";
    mentorNote = "Você fechou sua meta de hoje. Descanso também faz parte do aprendizado.";
  } else if (nextTask?.isTodayOrPast && nextTask.isEnriched) {
    mentorPose = "focus";
    mentorNote = "Sua sessão de hoje já está separada e pronta. É só dar o play.";
  } else if (nextTask && !nextTask.isTodayOrPast) {
    mentorPose = "sleepy";
    mentorNote = "Hoje é dia livre na sua rotina. Nos vemos no próximo horário combinado.";
  }

  return (
    <div className={`flex items-center gap-2.5 px-1 ${className}`}>
      <MascotBee pose={mentorPose} className="h-12 w-12 shrink-0" />
      <div className="relative flex-1 rounded-2xl bg-white border border-[#FF9B85]/25 px-3.5 py-2.5">
        <span
          aria-hidden="true"
          className="absolute -left-1.5 top-1/2 -translate-y-1/2 size-3 rotate-45 bg-white border-l border-b border-[#FF9B85]/25"
        />
        <p className="relative font-sans font-medium text-xs leading-relaxed text-[#2D3142]/80">
          {mentorNote}
        </p>
      </div>
    </div>
  );
}

export function ContextPanel({
  rhythm,
  nextTask,
  completedToday,
  onOpenReschedule,
}: ContextPanelProps) {
  const canReschedule = Boolean(nextTask && nextTask.nextReschedulePreview);

  const progressPct =
    nextTask && nextTask.planTotalTasks > 0
      ? Math.round((nextTask.planCompletedTasks / nextTask.planTotalTasks) * 100)
      : 0;

  return (
    <aside className="space-y-4">
      <div className="rounded-3xl bg-[#F3EFE6]/75 border border-[#F3EFE6] p-5 sm:p-6 space-y-6">
        {/* Ritmo Semanal */}
      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-medium text-[#2D3142]">
            Ritmo da semana
          </h2>
          <span className="text-xs font-semibold text-[#5B8DEF] tabular-nums">
            {rhythm.completed} de {rhythm.scheduled}{" "}
            {rhythm.scheduled === 1 ? "sessão" : "sessões"}
          </span>
        </div>

        {rhythm.scheduled > 0 ? (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: rhythm.scheduled }).map((_, idx) => {
              const done = idx < rhythm.completed;
              return (
                <span
                  key={idx}
                  className={`h-2.5 flex-1 rounded-full ${
                    done ? "bg-[#95E1B0]" : "bg-[#5B8DEF]/20"
                  }`}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#646B82]">
            Nenhuma sessão agendada para esta semana.
          </p>
        )}
      </div>

      {/* Progresso do Plano */}
      {nextTask && (
        <div className="space-y-2 pt-4 border-t border-[#2D3142]/8">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#2D3142]">
              Semana {nextTask.currentWeek} de {nextTask.totalWeeks}
            </span>
            <span className="text-[#646B82] tabular-nums">
              {nextTask.planCompletedTasks}/{nextTask.planTotalTasks} sessões ({progressPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white overflow-hidden">
            <div
              className="h-full rounded-full bg-[#5B8DEF] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Ação secundária: Reagendar próxima sessão */}
      {canReschedule && nextTask && (
        <button
          type="button"
          onClick={onOpenReschedule}
          className="group w-full flex items-center gap-3 rounded-2xl bg-white border border-[#2D3142]/8 px-3.5 py-3 text-left transition-colors hover:border-[#5B8DEF]/30 hover:bg-[#E8F0FE]/40 cursor-pointer"
        >
          <span className="size-9 shrink-0 rounded-xl bg-[#E8F0FE] text-[#5B8DEF] flex items-center justify-center transition-colors group-hover:bg-[#5B8DEF] group-hover:text-white">
            <Calendar className="size-4" />
          </span>
          <span className="flex-1 min-w-0 whitespace-nowrap text-[0.8rem] font-semibold text-[#2D3142]">
            Reagendar próxima sessão
          </span>
          <ArrowChevronRight className="size-4 shrink-0 text-[#646B82]/60 transition-all group-hover:translate-x-0.5 group-hover:text-[#5B8DEF]" />
        </button>
      )}
      </div>

      {/* Recado do Mentor (desktop) */}
      <MentorNote
        nextTask={nextTask}
        completedToday={completedToday}
        className="hidden lg:flex"
      />
    </aside>
  );
}
