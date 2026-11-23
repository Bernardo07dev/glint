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

const DURATION_OPTIONS = [15, 30, 60, 90];

export function QuestionSchedule({
  defaultDurationMinutes = 30,
  isSubmitting = false,
  onSubmit,
}: QuestionScheduleProps) {
  const initialDuration = DURATION_OPTIONS.includes(defaultDurationMinutes)
    ? defaultDurationMinutes
    : 30;
  const [slots, setSlots] = useState<ScheduleSlot[]>([
    { day: "mon", startTime: "19:00", durationMinutes: initialDuration },
    { day: "wed", startTime: "19:00", durationMinutes: initialDuration },
    { day: "sat", startTime: "10:00", durationMinutes: initialDuration },
  ]);
  const [customDrafts, setCustomDrafts] = useState<
    Partial<Record<ScheduleSlot["day"], string>>
  >({});
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: ScheduleSlot["day"]) => {
    setError(null);
    setCustomDrafts((prev) => {
      if (!(day in prev)) return prev;
      const next = { ...prev };
      delete next[day];
      return next;
    });
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
          durationMinutes: initialDuration,
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
    const hasInvalidDuration = slots.some((slot) => {
      const draft = customDrafts[slot.day];
      if (draft !== undefined) {
        const parsed = Number.parseInt(draft, 10);
        if (!Number.isFinite(parsed) || parsed < 5 || parsed > 480) {
          return true;
        }
      }
      return (
        !Number.isFinite(slot.durationMinutes) ||
        slot.durationMinutes < 5 ||
        slot.durationMinutes > 480
      );
    });
    if (hasInvalidDuration) {
      setError("Informe uma duração entre 5 e 480 minutos para cada sessão");
      return;
    }
    onSubmit({ inputType: "schedule_picker", slots });
  };

  const clearDraft = (day: ScheduleSlot["day"]) =>
    setCustomDrafts((prev) => {
      if (!(day in prev)) return prev;
      const next = { ...prev };
      delete next[day];
      return next;
    });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-[#646B82]">
              <Calendar className="size-3.5 text-[#5B8DEF]" />
              Dias da semana
            </span>
            {slots.length > 0 && (
              <span className="text-center sm:text-left font-sans text-xs text-[#646B82] tabular-nums">
                {formattedTotal}/semana
              </span>
            )}
          </div>

          <div className="flex gap-1 sm:gap-1.5">
            {WEEK_DAYS.map((day) => {
              const isSelected = slots.some((s) => s.day === day.key);
              return (
                <button
                  key={day.key}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => toggleDay(day.key)}
                  aria-pressed={isSelected}
                  className={`flex-1 min-w-0 h-10 sm:h-9 rounded-full font-sans text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#5B8DEF] text-[#FFFFFF]"
                      : "text-[#646B82] hover:bg-[#E8F0FE] hover:text-[#5B8DEF]"
                  }`}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
        </div>

        {slots.length > 0 && (
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-[#646B82]">
              <Clock className="size-3.5 text-[#5B8DEF]" />
              Horário e duração
            </span>

            <ul className="divide-y divide-[#2D3142]/6">
              {slots.map((slot) => {
                const dayMeta = WEEK_DAYS.find((d) => d.key === slot.day);
                const draft = customDrafts[slot.day];
                const isPreset =
                  draft === undefined &&
                  DURATION_OPTIONS.includes(slot.durationMinutes);
                const customValue =
                  draft ?? (isPreset ? "" : String(slot.durationMinutes));
                return (
                  <li
                    key={slot.day}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 sm:py-2.5"
                  >
                    <span className="flex-1 sm:flex-none sm:w-16 font-sans text-[13px] text-[#2D3142]">
                      {dayMeta?.full}
                    </span>
                    <input
                      type="time"
                      value={slot.startTime}
                      disabled={isSubmitting}
                      aria-label={`Horário de ${dayMeta?.full}`}
                      onChange={(e) =>
                        updateSlot(slot.day, { startTime: e.target.value })
                      }
                      className="h-8 rounded-lg px-2 font-sans text-xs text-[#2D3142] tabular-nums cursor-pointer hover:bg-[#F3EFE6] focus:outline-none focus:bg-[#E8F0FE]"
                    />

                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-0.5 sm:ml-auto">
                      {DURATION_OPTIONS.map((minutes) => {
                        const active =
                          isPreset && slot.durationMinutes === minutes;
                        return (
                          <button
                            key={minutes}
                            type="button"
                            disabled={isSubmitting}
                            aria-pressed={active}
                            onClick={() => {
                              setError(null);
                              clearDraft(slot.day);
                              updateSlot(slot.day, { durationMinutes: minutes });
                            }}
                            className={`h-9 sm:h-7 flex-1 sm:flex-none px-2 rounded-full font-sans text-xs tabular-nums transition-colors cursor-pointer ${
                              active
                                ? "bg-[#E8F0FE] text-[#5B8DEF] font-medium"
                                : "text-[#646B82]/80 hover:text-[#2D3142]"
                            }`}
                          >
                            {minutes}m
                          </button>
                        );
                      })}
                      <input
                        type="number"
                        min={5}
                        max={480}
                        step={1}
                        disabled={isSubmitting}
                        value={customValue}
                        placeholder="outro"
                        aria-label={`Duração personalizada de ${dayMeta?.full} em minutos`}
                        onChange={(e) => {
                          setError(null);
                          const raw = e.target.value;
                          setCustomDrafts((prev) => ({
                            ...prev,
                            [slot.day]: raw,
                          }));
                          const parsed = Number.parseInt(raw, 10);
                          if (Number.isFinite(parsed) && parsed > 0) {
                            updateSlot(slot.day, { durationMinutes: parsed });
                          }
                        }}
                        className={`h-9 sm:h-7 w-14 sm:w-12 rounded-full text-center font-sans text-xs tabular-nums placeholder:text-[#646B82]/60 focus:outline-none focus:bg-[#E8F0FE] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          !isPreset
                            ? "bg-[#E8F0FE] text-[#5B8DEF] font-medium"
                            : "bg-transparent text-[#2D3142]"
                        }`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="font-sans text-xs text-[#C85A54]">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <span className="text-center sm:text-left font-sans text-xs text-[#646B82] tabular-nums">
          {slots.length}{" "}
          {slots.length === 1 ? "sessão por semana" : "sessões por semana"}
        </span>

        <Button
          type="submit"
          isDisabled={isSubmitting || slots.length === 0}
          className="w-full sm:w-auto h-11 sm:h-10 px-5 rounded-full bg-[#FF9B85] hover:bg-[#ff8a70] disabled:opacity-50 font-sans text-[#FFFFFF] font-medium text-[13px] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>{isSubmitting ? "Salvando..." : "Confirmar rotina"}</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
