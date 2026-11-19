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
        <div className="rounded-2xl bg-[#F3EFE6]/70 border border-[#F3EFE6] p-4 space-y-2.5">
          {selectedDay.sessions.map((session) => (
            <div
              key={`${session.planId}-${session.taskId}`}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-[#646B82] truncate">
                  {session.planTitle}
                </p>
                <p className="text-sm font-medium text-[#2D3142] leading-snug">
                  {session.title}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs tabular-nums">
                <span className="text-[#646B82]">
                  {session.startTime} · {session.durationMinutes}m
                </span>
                {session.status === "completed" ? (
                  <CircleCheck className="size-4 text-[#2B6E47]" />
                ) : session.isLocked ? (
                  <Lock className="size-3.5 text-[#646B82]" />
                ) : (
                  <Clock className="size-3.5 text-[#5B8DEF]" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
