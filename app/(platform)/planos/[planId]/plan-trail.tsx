"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  Lock,
  Play,
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
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  let foundCurrent = false;

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 pt-6 sm:pt-9 space-y-8">
      {/* Topo editorial */}
      <header className="space-y-5">
        <Link
          href="/planos"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#646B82] hover:text-[#2D3142] cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Voltar para Planos</span>
        </Link>

        <h1 className="font-display text-xl sm:text-2xl font-medium text-[#2D3142] leading-snug max-w-[30ch]">
          {title}
        </h1>

        {routineContract && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setScheduleOpen((prev) => !prev)}
              aria-expanded={scheduleOpen}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs tabular-nums transition-colors cursor-pointer ${
                scheduleOpen
                  ? "bg-[#E8F0FE]/85 border-[#5B8DEF]/25 text-[#2D3142]"
                  : "bg-white/90 border-[#2D3142]/8 text-[#2D3142] hover:bg-[#FFFDF8]"
              }`}
            >
              <Clock className="size-3.5 text-[#5B8DEF] shrink-0" aria-hidden="true" />
              <span className="font-semibold">
                {routineContract.weeklyHours}h/semana
              </span>
              <span className="text-[#646B82]/60" aria-hidden="true">
                ·
              </span>
              <span className="font-medium text-[#646B82]">
                {routineContract.slots.length}{" "}
                {routineContract.slots.length === 1 ? "horário" : "horários"}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`size-3.5 text-[#646B82] ml-0.5 transition-transform duration-200 ${
                  scheduleOpen ? "rotate-180 text-[#5B8DEF]" : ""
                }`}
              />
            </button>

            {scheduleOpen && (
              <div className="flex flex-wrap items-center gap-1.5">
                {routineContract.slots.map((s, idx) => {
                  const dayLabel =
                    DAY_NAME_PT[s.dayOfWeek.toLowerCase()] ?? s.dayOfWeek;
                  const shortDay = dayLabel.slice(0, 3);
                  return (
                    <span
                      key={`${s.dayOfWeek}-${s.startTime}-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 border border-[#2D3142]/8 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs tabular-nums"
                    >
                      <span className="font-medium text-[#2D3142]">
                        <span className="sm:hidden">{shortDay}</span>
                        <span className="hidden sm:inline">{dayLabel}</span>
                      </span>
                      <span className="text-[#2D3142]/25" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-medium text-[#646B82]">
                        {s.startTime}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {successCriteria.length > 0 && (
          <div className="rounded-2xl sm:rounded-3xl bg-white/90 border border-[#2D3142]/6 overflow-hidden">
            {/* Mobile dropdown trigger */}
            <button
              type="button"
              onClick={() => setCriteriaOpen((prev) => !prev)}
              aria-expanded={criteriaOpen}
              aria-controls="plan-success-criteria"
              className="sm:hidden w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#FFFDF8] transition-colors cursor-pointer"
            >
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-display text-[15px] font-medium text-[#2D3142]">
                  Critérios de sucesso
                </span>
                <span className="text-xs font-medium text-[#646B82]/80 tabular-nums shrink-0">
                  · {successCriteria.length}
                </span>
              </div>
              <ChevronDown
                aria-hidden="true"
                className={`size-4 text-[#646B82] shrink-0 transition-transform duration-200 ${
                  criteriaOpen ? "rotate-180 text-[#5B8DEF]" : ""
                }`}
              />
            </button>

            {/* Desktop static heading */}
            <h2 className="hidden sm:block font-display text-base font-medium text-[#2D3142] px-6 pt-6 pb-3">
              Critérios de sucesso
            </h2>

            <ul
              id="plan-success-criteria"
              className={`${
                criteriaOpen ? "block" : "hidden"
              } sm:block space-y-2.5 px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-0 border-t border-[#F3EFE6] sm:border-t-0`}
            >
              {successCriteria.map((criterion, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-[13px] sm:text-sm text-[#2D3142]/90 leading-relaxed max-w-[70ch]"
                >
                  <span className="mt-2 size-1.5 rounded-full bg-[#5B8DEF]/75 shrink-0" />
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
