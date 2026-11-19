"use client";

import { Calendar } from "@gravity-ui/icons";
import { MascotBee, type MascotBeePose } from "@/app/components/mascot-bee";
import type { ResolvedNextTask, WeeklyRhythm } from "@/lib/plan-structure";

interface ContextPanelProps {
  rhythm: WeeklyRhythm;
  nextTask: ResolvedNextTask | null;
  completedToday: boolean;
  onOpenReschedule: () => void;
}

export function ContextPanel({
  rhythm,
  nextTask,
  completedToday,
  onOpenReschedule,
}: ContextPanelProps) {
  const canReschedule = Boolean(
    nextTask && nextTask.isTodayOrPast && nextTask.nextReschedulePreview,
  );

  const progressPct =
    nextTask && nextTask.planTotalTasks > 0
      ? Math.round((nextTask.planCompletedTasks / nextTask.planTotalTasks) * 100)
      : 0;

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
    <aside className="rounded-3xl bg-[#F3EFE6]/75 border border-[#F3EFE6] p-5 sm:p-6 space-y-6">
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

      {/* Recado do Mentor */}
      <div className="rounded-2xl bg-[#FFF0E5]/80 p-4 flex items-center gap-3">
        <MascotBee pose={mentorPose} className="h-14 w-16 shrink-0" />
        <p className="text-xs sm:text-[13px] leading-relaxed text-[#2D3142]">
          {mentorNote}
        </p>
      </div>

      {/* Ação secundária: Imprevisto hoje? */}
      {canReschedule && (
        <div className="pt-2 border-t border-[#2D3142]/8">
          <button
            type="button"
            onClick={onOpenReschedule}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-[#646B82] hover:text-[#2D3142] hover:bg-white/70 transition-colors cursor-pointer"
          >
            <Calendar className="size-4" />
            <span>Imprevisto hoje? Reagendar sessão</span>
          </button>
        </div>
      )}
    </aside>
  );
}
