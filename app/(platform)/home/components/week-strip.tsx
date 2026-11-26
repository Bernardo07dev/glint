"use client";

import { useState } from "react";
import {
  ArrowUturnCcwLeft,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Lock,
} from "@gravity-ui/icons";
import type { WeekStripDay, WeekStripWeek } from "@/lib/plan/plan-structure";

interface WeekStripProps {
  weeks: WeekStripWeek[];
}

function getDefaultSelectedDate(days: WeekStripDay[]): string | null {
  return (
    days.find((d) => d.isToday && d.sessions.length > 0)?.dateIso ??
    days.find((d) => d.sessions.length > 0)?.dateIso ??
    null
  );
}

export function WeekStrip({ weeks }: WeekStripProps) {
  const [weekIndex, setWeekIndex] = useState(0);
  const currentWeek = weeks[weekIndex] ?? weeks[0];
  const days = currentWeek?.days ?? [];

  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    getDefaultSelectedDate(days),
  );
  const selectedDay = days.find((d) => d.dateIso === selectedDate) ?? null;

  const handleChangeWeek = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= weeks.length) return;
    setWeekIndex(nextIndex);
    setSelectedDate(getDefaultSelectedDate(weeks[nextIndex].days));
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <h2 className="font-display text-base sm:text-lg font-medium text-[#2D3142] whitespace-nowrap">
            Sua semana
          </h2>
          {weekIndex > 0 && (
            <button
              type="button"
              onClick={() => handleChangeWeek(0)}
              aria-label="Voltar para hoje"
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-[#E8F0FE]/60 border border-[#5B8DEF]/25 text-[11px] sm:text-xs font-semibold text-[#5B8DEF] hover:bg-[#5B8DEF] hover:text-white hover:border-[#5B8DEF] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowUturnCcwLeft className="size-3 shrink-0" aria-hidden="true" />
              <span className="sm:hidden">Hoje</span>
              <span className="hidden sm:inline">Voltar para hoje</span>
            </button>
          )}
        </div>

        <div className="inline-flex items-center gap-0.5 rounded-xl bg-white border border-[#F3EFE6] p-1 shrink-0">
          <button
            type="button"
            onClick={() => handleChangeWeek(weekIndex - 1)}
            disabled={weekIndex === 0}
            aria-label="Semana anterior"
            className="p-1 rounded-lg flex items-center justify-center bg-gray-100 text-[#646B82] hover:bg-[#F3EFE6]/80 hover:text-[#2D3142] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronLeft className="size-3.5 " />
          </button>

          <span className="text-[11px] sm:text-xs font-semibold text-[#2D3142]/80 tabular-nums min-w-[76px] sm:min-w-[96px] px-1 sm:px-1.5 text-center select-none whitespace-nowrap">
            {currentWeek?.rangeLabel ?? "Seg — Dom"}
          </span>

          <button
            type="button"
            onClick={() => handleChangeWeek(weekIndex + 1)}
            disabled={weekIndex >= weeks.length - 1}
            aria-label="Próxima semana"
            className="p-1 rounded-lg flex items-center justify-center bg-gray-100 text-[#646B82] hover:bg-[#F3EFE6]/80 hover:text-[#2D3142] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${weekIndex * 100}%)` }}
        >
          {weeks.map((week, wIdx) => (
            <div
              key={`${week.rangeLabel}-${wIdx}`}
              aria-hidden={wIdx !== weekIndex}
              className="w-full shrink-0 grid grid-cols-7 gap-1.5 sm:gap-2"
            >
              {week.days.map((day) => {
                const hasSessions = day.sessions.length > 0;
                const allCompleted =
                  hasSessions && day.sessions.every((s) => s.status === "completed");
                const isSelected = selectedDate === day.dateIso;

                let dotClass = "bg-transparent";
                if (hasSessions) {
                  if (allCompleted) dotClass = "bg-[#95E1B0]";
                  else if (day.isToday) dotClass = "bg-[#5B8DEF]";
                  else dotClass = "bg-[#2D3142]/25";
                }

                return (
                  <button
                    key={day.dateIso}
                    type="button"
                    tabIndex={wIdx === weekIndex ? 0 : -1}
                    onClick={() => setSelectedDate(isSelected ? null : day.dateIso)}
                    className={`flex flex-col items-center justify-center rounded-2xl py-2.5 sm:py-3 px-1 transition-colors cursor-pointer border ${day.isToday
                      ? "bg-[#E8F0FE] border-[#5B8DEF]/40 text-[#5B8DEF]"
                      : isSelected
                        ? "bg-[#F3EFE6] border-[#2D3142]/15 text-[#2D3142]"
                        : "bg-white border-[#F3EFE6] text-[#2D3142] hover:bg-[#F3EFE6]/50"
                      }`}
                  >
                    <span className="text-[11px] font-medium opacity-80">
                      {day.shortLabel}
                    </span>
                    <span className="text-sm sm:text-base font-semibold tabular-nums mt-0.5">
                      {day.dayNumber}
                    </span>
                    <span
                      className={`mt-1.5 size-2 rounded-full ${dotClass}`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedDay && selectedDay.sessions.length > 0 && (
        <div className="rounded-2xl bg-white border border-[#2D3142]/8 divide-y divide-[#2D3142]/6 overflow-hidden">
          {selectedDay.sessions.map((session) => {
            const accentClass =
              session.status === "completed"
                ? "bg-[#95E1B0]"
                : session.isLocked
                  ? "bg-[#2D3142]/20"
                  : "bg-[#5B8DEF]";

            return (
              <div
                key={`${session.planId}-${session.taskId}`}
                className="flex items-stretch gap-5 p-4"
              >
                <span
                  aria-hidden="true"
                  className={`w-1 shrink-0 rounded-full ${accentClass}`}
                />

                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-[#646B82]/80 tabular-nums">
                    {session.status === "completed" ? (
                      <CircleCheck className="size-3 text-[#2B6E47]" />
                    ) : session.isLocked ? (
                      <Lock className="size-3 text-[#646B82]" />
                    ) : (
                      <Clock className="size-3 text-[#5B8DEF]" />
                    )}
                    <span>
                      {session.startTime} · {session.durationMinutes} min
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="font-display text-[15px] sm:text-base font-medium text-[#2D3142] leading-snug">
                      {session.title}
                    </p>
                    <p className="font-sans font-medium text-xs leading-relaxed text-[#2D3142]/60 truncate">
                      {session.planTitle}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
