"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@heroui/react";
import { ArrowRight, Calendar, Clock } from "@gravity-ui/icons";
import type { QuestionAnswer, ScheduleSlot } from "./types";

interface QuestionScheduleProps {
  defaultDurationMinutes?: number;
  isSubmitting?: boolean;
  onSubmit: (answer: QuestionAnswer) => void;
}

const WEEK_DAYS: { key: ScheduleSlot["day"]; short: string; full: string }[] = [
  { key: "mon", short: "Seg", full: "Segunda" },
  { key: "tue", short: "Ter", full: "Terça" },
  { key: "wed", short: "Qua", full: "Quarta" },
  { key: "thu", short: "Qui", full: "Quinta" },
  { key: "fri", short: "Sex", full: "Sexta" },
  { key: "sat", short: "Sáb", full: "Sábado" },
  { key: "sun", short: "Dom", full: "Domingo" },
];

const DURATION_OPTIONS = [20, 30, 45, 60, 90];

export function QuestionSchedule({
  defaultDurationMinutes = 30,
  isSubmitting = false,
  onSubmit,
}: QuestionScheduleProps) {
  const [slots, setSlots] = useState<ScheduleSlot[]>([
    { day: "mon", startTime: "19:00", durationMinutes: defaultDurationMinutes },
    { day: "wed", startTime: "19:00", durationMinutes: defaultDurationMinutes },
    { day: "sat", startTime: "10:00", durationMinutes: defaultDurationMinutes },
  ]);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: ScheduleSlot["day"]) => {
    setError(null);
    setSlots((prev) => {
      const exists = prev.some((s) => s.day === day);
      if (exists) {
        return prev.filter((s) => s.day !== day);
      }
      const fallbackTime = day === "sat" || day === "sun" ? "10:00" : "19:00";
      const next = [
        ...prev,
        {
          day,
          startTime: fallbackTime,
          durationMinutes: defaultDurationMinutes,
        },
      ];
      return WEEK_DAYS.map((d) => next.find((s) => s.day === d.key)).filter(
        (s): s is ScheduleSlot => Boolean(s),
      );
    });
  };

  const updateSlot = (
    day: ScheduleSlot["day"],
    patch: Partial<Pick<ScheduleSlot, "startTime" | "durationMinutes">>,
  ) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.day === day ? { ...slot, ...patch } : slot)),
    );
  };

  const totalWeeklyMinutes = slots.reduce(
    (sum, slot) => sum + slot.durationMinutes,
    0,
  );
  const totalHours = Math.floor(totalWeeklyMinutes / 60);
  const remainingMinutes = totalWeeklyMinutes % 60;
  const formattedTotal =
    totalHours > 0
      ? remainingMinutes > 0
        ? `${totalHours}h ${remainingMinutes}min`
        : `${totalHours}h`
      : `${remainingMinutes}min`;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (slots.length === 0) {
      setError("Escolha pelo menos um dia na semana para estudar");
      return;
    }
    onSubmit({ inputType: "schedule_picker", slots });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative rounded-2xl bg-[#FFFFFF] border border-[#2D3142]/10 p-4 space-y-4">
        {slots.length > 0 && (
          <span
            key={formattedTotal}
            className="absolute -top-3 right-4 inline-flex items-center rounded-md bg-[#E8F0FE] border border-[#5B8DEF]/10 px-3 py-1 font-sans text-xs font-semibold text-[#5B8DEF] tabular-nums shadow-sm animate-[glint-pop_200ms_cubic-bezier(0.22,1,0.36,1)]"
          >
            {formattedTotal}/semana
          </span>
        )}
        <style jsx>{`
          @keyframes glint-pop {
            0% {
              opacity: 0;
              transform: translateY(4px) scale(0.92);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#646B82]">
            <Calendar className="size-4 text-[#5B8DEF]" />
            <span className="font-sans text-xs py-2 font-semibold">
              Dias disponíveis na semana
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEK_DAYS.map((day) => {
              const isSelected = slots.some((s) => s.day === day.key);
              return (
                <button
                  key={day.key}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => toggleDay(day.key)}
                  aria-pressed={isSelected}
                  className={`h-10 rounded-xl font-sans text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#5B8DEF] text-[#FFFFFF]"
                      : "bg-[#F3EFE6] text-[#2D3142] hover:bg-[#E8F0FE] hover:text-[#5B8DEF]"
                  }`}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
        </div>

        {slots.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#2D3142]/8">
            <div className="flex items-center text-[#646B82]">
              <span className="inline-flex items-center gap-1.5 py-2 pt-3 text-xs font-semibold">
                <Clock className="size-3.5 text-[#5B8DEF]" />
                Horário e duração de cada sessão
              </span>
            </div>

            <div className="space-y-2">
              {slots.map((slot) => {
                const dayMeta = WEEK_DAYS.find((d) => d.key === slot.day);
                return (
                  <div
                    key={slot.day}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FFFDF8] border border-[#2D3142]/8 px-3 py-2.5"
                  >
                    <span className="font-display text-sm text-[#2D3142] w-16">
                      {dayMeta?.full}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        value={slot.startTime}
                        disabled={isSubmitting}
                        aria-label={`Horário de ${dayMeta?.full}`}
                        onChange={(e) =>
                          updateSlot(slot.day, { startTime: e.target.value })
                        }
                        className="h-8 rounded-lg bg-[#FFFFFF] border border-[#2D3142]/12 px-2 font-sans text-xs font-medium text-[#2D3142] tabular-nums focus:outline-none focus:border-[#5B8DEF]"
                      />

                      <div className="flex items-center gap-1">
                        {DURATION_OPTIONS.map((minutes) => {
                          const active = slot.durationMinutes === minutes;
                          return (
                            <button
                              key={minutes}
                              type="button"
                              disabled={isSubmitting}
                              onClick={() =>
                                updateSlot(slot.day, {
                                  durationMinutes: minutes,
                                })
                              }
                              className={`h-8 px-2 rounded-lg font-sans text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                                active
                                  ? "bg-[#E8F0FE] text-[#5B8DEF] border border-[#5B8DEF]/40"
                                  : "bg-[#F3EFE6] text-[#646B82] hover:text-[#2D3142]"
                              }`}
                            >
                              {minutes}m
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="font-sans text-xs font-medium text-[#C85A54]">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <span className="font-sans text-xs text-[#646B82] tabular-nums">
          {slots.length}{" "}
          {slots.length === 1 ? "sessão por semana" : "sessões por semana"}
        </span>

        <Button
          type="submit"
          isDisabled={isSubmitting || slots.length === 0}
          className="h-11 px-5 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] disabled:opacity-50 font-sans text-[#FFFFFF] font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>{isSubmitting ? "Salvando..." : "Confirmar rotina"}</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
