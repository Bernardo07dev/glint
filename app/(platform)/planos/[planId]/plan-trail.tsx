"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Lock,
  Play,
  Calendar,
} from "@gravity-ui/icons";
import {
  DAY_NAME_PT,
  formatWeekdayAndDatePt,
  getTaskStatus,
  isTaskUnlockedForDate,
  type RoutineContract,
  type WeekGroup,
} from "@/lib/plan-structure";

interface PlanTrailProps {
  title: string;
  successCriteria: string[];
  routineContract: RoutineContract | null;
  weeks: WeekGroup[];
  todayIso: string;
}

export function PlanTrail({
  title,
  successCriteria,
  routineContract,
  weeks,
  todayIso,
}: PlanTrailProps) {
  let foundCurrent = false;

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 pt-6 sm:pt-9 space-y-8">
      {/* Topo editorial */}
      <header className="space-y-5">
        <Link
          href="/planos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#646B82] hover:text-[#2D3142] cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Voltar para Planos</span>
        </Link>

        <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#2D3142] leading-snug max-w-[30ch]">
          {title}
        </h1>

        {routineContract && (
          <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl bg-[#F3EFE6] px-4 py-2.5 text-xs sm:text-sm text-[#2D3142]">
            <Calendar className="size-4 text-[#5B8DEF]" />
            <span className="font-medium tabular-nums">
              {routineContract.weeklyHours}h/semana
            </span>
            <span className="text-[#646B82]">·</span>
            <span className="text-[#646B82]">
              {routineContract.slots
                .map(
                  (s) =>
                    `${DAY_NAME_PT[s.dayOfWeek.toLowerCase()] ?? s.dayOfWeek} ${s.startTime}`,
                )
                .join(", ")}
            </span>
          </div>
        )}

        {successCriteria.length > 0 && (
          <div className="rounded-3xl bg-white border border-[#F3EFE6] p-5 sm:p-6 space-y-3">
            <h2 className="font-display text-base font-medium text-[#2D3142]">
              Critérios de sucesso
            </h2>
            <ul className="space-y-2">
              {successCriteria.map((criterion, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm text-[#2D3142] leading-relaxed max-w-[70ch]"
                >
                  <span className="mt-1.5 size-1.5 rounded-full bg-[#5B8DEF] shrink-0" />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* Trilha vertical por semanas */}
      <div className="space-y-8">
        {weeks.map((group) => (
          <section key={group.weekNumber} className="space-y-4">
            <h2 className="font-display text-lg font-medium text-[#2D3142]">
              Semana {group.weekNumber}
            </h2>

            <ol className="relative space-y-3 pl-7 before:content-[''] before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-[#F3EFE6]">
              {group.tasks.map((task) => {
                const status = getTaskStatus(task);
                const isCompleted = status === "completed";
                const unlocked = isTaskUnlockedForDate(task, todayIso);
                const isCurrent = !isCompleted && !foundCurrent && unlocked;
                if (isCurrent) foundCurrent = true;

                return (
                  <li key={task.taskId} className="relative">
                    {/* Nó na linha vertical */}
                    <span
                      className={`absolute -left-7 top-4 size-6 rounded-full flex items-center justify-center border-2 border-[#FFFDF8] ${
                        isCompleted
                          ? "bg-[#95E1B0] text-[#2D3142]"
                          : isCurrent
                            ? "bg-[#5B8DEF] text-white"
                            : "bg-[#F3EFE6] text-[#646B82]"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="size-3.5" />
                      ) : isCurrent ? (
                        <Play className="size-3" />
                      ) : (
                        <Lock className="size-3" />
                      )}
                    </span>

                    <div
                      className={`rounded-2xl p-4 sm:p-5 border ${
                        isCurrent
                          ? "bg-[#E8F0FE]/50 border-[#5B8DEF]/35"
                          : isCompleted
                            ? "bg-white border-[#95E1B0]/40"
                            : "bg-[#F3EFE6]/60 border-[#F3EFE6]"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <p className="text-xs text-[#646B82] tabular-nums">
                            {formatWeekdayAndDatePt(task.schedule.date)} às{" "}
                            {task.schedule.startTime} ·{" "}
                            {task.schedule.durationMinutes} min
                          </p>
                          <h3 className="font-display text-base sm:text-lg font-medium text-[#2D3142] leading-snug">
                            {task.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-[#646B82] leading-relaxed max-w-[65ch]">
                            {task.whyItMatters}
                          </p>
                        </div>

                        {isCurrent && (
                          <Link
                            href="/home"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5B8DEF] hover:bg-[#4b7de0] text-white text-xs font-semibold px-4 py-2 shrink-0 transition-colors cursor-pointer"
                          >
                            Ir para sessão
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
