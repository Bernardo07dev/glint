"use client";

import { useState } from "react";
import { CircleCheck, Clock, Lock } from "@gravity-ui/icons";
import type { WeekStripDay } from "@/lib/plan-structure";

interface WeekStripProps {
  days: WeekStripDay[];
}

export function WeekStrip({ days }: WeekStripProps) {
  const defaultSelected =
    days.find((d) => d.isToday && d.sessions.length > 0)?.dateIso ??
    days.find((d) => d.sessions.length > 0)?.dateIso ??
    null;

  const [selectedDate, setSelectedDate] = useState<string | null>(defaultSelected);
  const selectedDay = days.find((d) => d.dateIso === selectedDate) ?? null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-[#2D3142]">
          Sua semana
        </h2>
        <span className="text-xs text-[#646B82]">Seg — Dom</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
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
              onClick={() => setSelectedDate(isSelected ? null : day.dateIso)}
              className={`flex flex-col items-center justify-center rounded-2xl py-2.5 sm:py-3 px-1 transition-colors cursor-pointer border ${
                day.isToday
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
