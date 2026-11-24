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
  planId: string;
  title: string;
  successCriteria: string[];
  routineContract: RoutineContract | null;
  weeks: WeekGroup[];
  todayIso: string;
}

export function PlanTrail({
  planId,
  title,
  successCriteria,
  routineContract,
  weeks,
  todayIso,
}: PlanTrailProps) {
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const currentTaskId = weeks
    .flatMap((w) => w.tasks)
    .find(
      (t) =>
        getTaskStatus(t) !== "completed" && isTaskUnlockedForDate(t, todayIso),
    )?.taskId;

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

        <h1 className="font-display text-xl sm:text-2xl font-medium text-[#2D3142] leading-snug ">
          {title}
        </h1>

        {(routineContract || successCriteria.length > 0) && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {routineContract && (
                <button
                  type="button"
                  onClick={() => {
                    setScheduleOpen((prev) => !prev);
                    setCriteriaOpen(false);
                  }}
                  aria-expanded={scheduleOpen}
                  className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-medium tabular-nums transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#646B82] ${
                    scheduleOpen
                      ? "bg-[#E8F0FE] text-[#2D3142]"
                      : "bg-[#F3EFE6] text-[#2D3142] hover:bg-[#E8F0FE]"
                  }`}
                >
                  <Clock className="size-3.5 text-[#646B82] shrink-0" aria-hidden="true" />
                  <span>{routineContract.weeklyHours}h/semana</span>
                  <span className="hidden sm:inline text-[#646B82]/50" aria-hidden="true">
                    ·
                  </span>
                  <span className="hidden sm:inline text-[#646B82]">
                    {routineContract.slots.length}{" "}
                    {routineContract.slots.length === 1 ? "horário" : "horários"}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`size-3.5 text-[#646B82] shrink-0 transition-transform duration-150 ${
                      scheduleOpen ? "rotate-180 text-[#2D3142]" : ""
                    }`}
                  />
                </button>
              )}

              {successCriteria.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCriteriaOpen((prev) => !prev);
                    setScheduleOpen(false);
                  }}
                  aria-expanded={criteriaOpen}
                  aria-controls="plan-success-criteria"
                  className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-medium tabular-nums transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#646B82] ${
                    criteriaOpen
                      ? "bg-[#E8F0FE] text-[#2D3142]"
                      : "bg-[#F3EFE6] text-[#2D3142] hover:bg-[#E8F0FE]"
                  }`}
                >
                  <Check
                    className="size-3.5 text-[#646B82] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    Critérios<span className="hidden sm:inline"> de sucesso</span>
                  </span>
                  <span className="text-[#646B82]/50" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[#646B82]">
                    {successCriteria.length}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`size-3.5 text-[#646B82] shrink-0 transition-transform duration-150 ${
                      criteriaOpen ? "rotate-180 text-[#2D3142]" : ""
                    }`}
                  />
                </button>
              )}
            </div>

            {routineContract && scheduleOpen && (
              <div className="flex flex-wrap items-center gap-1.5">
                {routineContract.slots.map((s, idx) => {
                  const dayLabel =
                    DAY_NAME_PT[s.dayOfWeek.toLowerCase()] ?? s.dayOfWeek;
                  const shortDay = dayLabel.slice(0, 3);
                  return (
                    <span
                      key={`${s.dayOfWeek}-${s.startTime}-${idx}`}
                      className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#F3EFE6]/60 px-3 text-xs tabular-nums"
                    >
                      <span className="font-medium text-[#2D3142]">
                        <span className="sm:hidden">{shortDay}</span>
                        <span className="hidden sm:inline">{dayLabel}</span>
                      </span>
                      <span className="text-[#646B82]/50" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-[#646B82]">{s.startTime}</span>
                    </span>
                  );
                })}
              </div>
            )}

            {successCriteria.length > 0 && criteriaOpen && (
              <ul
                id="plan-success-criteria"
                className="rounded-2xl bg-white border border-[#2D3142]/8 p-4 sm:p-5 space-y-2.5 max-w-[68ch]"
              >
                {successCriteria.map((criterion, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 font-sans text-xs sm:text-[13px] font-medium text-[#2D3142]/85 leading-[1.6]"
                  >
                    <span className="mt-0.5 size-4 rounded-full bg-[#95E1B0]/35 flex items-center justify-center shrink-0">
                      <Check
                        className="size-2.5 text-[#2B6E47]"
                        aria-hidden="true"
                      />
                    </span>
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            )}
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

            <ol className="relative space-y-2.5 pl-7 before:content-[''] before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-[#F3EFE6]">
              {group.tasks.map((task) => {
                const status = getTaskStatus(task);
                const isCompleted = status === "completed";
                const isCurrent = task.taskId === currentTaskId;

                return (
                  <li key={task.taskId} className="relative">
                    {/* Nó na linha vertical */}
                    <span
                      className={`absolute -left-7 top-4 size-6 rounded-full flex items-center justify-center border-4 border-[#FFFDF8] ${
                        isCompleted
                          ? "bg-[#95E1B0] text-[#2D3142]"
                          : isCurrent
                            ? "bg-[#5B8DEF] text-white"
                            : "bg-[#F3EFE6] text-[#646B82]"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="size-3.5 " />
                      ) : isCurrent ? (
                        <Play className="size-3" />
                      ) : (
                        <Lock className="size-3" />
                      )}
                    </span>

                    <div
                      className={`rounded-2xl p-5 sm:p-5 border ${
                        isCurrent
                          ? "bg-[#E8F0FE]/50 border-[#5B8DEF]/35"
                          : isCompleted
                            ? "bg-white border-[#95E1B0]/40"
                            : "bg-[#F3EFE6]/60 border-[#F3EFE6]"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="space-y-1 min-w-0">
                          <p className="text-[0.7rem] text-[#646B82] font-medium tabular-nums">
                            {formatWeekdayAndDatePt(task.schedule.date)} às{" "}
                            {task.schedule.startTime} ·{" "}
                            {task.schedule.durationMinutes} min
                          </p>
                          <h3 className="font-display text-sm sm:text-[1.1rem] font-medium text-[#2D3142] leading-snug">
                            {task.title}
                          </h3>
                          <p className="text-xs text-[#646B82] leading-[1.55]">
                            {task.whyItMatters}
                          </p>
                        </div>

                        {isCurrent && (
                          <Link
                            href={`/planos/${planId}/tasks/${task.taskId}`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5B8DEF] hover:bg-[#4b7de0] text-white text-xs font-semibold px-3.5 py-2 shrink-0 transition-colors cursor-pointer"
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
