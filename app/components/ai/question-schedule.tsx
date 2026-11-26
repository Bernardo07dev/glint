"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@heroui/react";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock,
  TriangleExclamation,
} from "@gravity-ui/icons";
import type { QuestionAnswer, QuestionPayload, ScheduleSlot } from "./types";

interface QuestionScheduleProps {
  defaultDurationMinutes?: number;
  occupiedSlots?: QuestionPayload["occupiedSlots"];
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

const TIME_PERIODS = [
  {
    id: "morning",
    label: "Manhã",
    times: ["07:00", "08:00", "09:00", "10:00", "11:00"],
  },
  {
    id: "afternoon",
    label: "Tarde",
    times: ["13:00", "14:00", "15:00", "16:00", "17:00"],
  },
  {
    id: "evening",
    label: "Noite",
    times: ["18:00", "19:00", "20:00", "21:00", "22:00"],
  },
] as const;

const MINUTE_STEPS = ["00", "15", "30", "45"];

const DAY_NAME_TO_KEY: Record<string, ScheduleSlot["day"]> = {
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
  sunday: "sun",
};

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

function formatMinutes(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function QuestionSchedule({
  defaultDurationMinutes = 30,
  occupiedSlots,
  isSubmitting = false,
  onSubmit,
}: QuestionScheduleProps) {
  const initialDuration = DURATION_OPTIONS.includes(defaultDurationMinutes)
    ? defaultDurationMinutes
    : 30;

  const occupiedByDay = new Map<
    ScheduleSlot["day"],
    { startTime: string; durationMinutes: number }[]
  >();
  for (const slot of occupiedSlots ?? []) {
    const day = DAY_NAME_TO_KEY[slot.dayOfWeek];
    if (!day) continue;
    const list = occupiedByDay.get(day) ?? [];
    list.push({
      startTime: slot.startTime,
      durationMinutes: slot.durationMinutes,
    });
    occupiedByDay.set(day, list);
  }

  const checkTimeOverlap = (
    day: ScheduleSlot["day"],
    startTime: string,
    durationMinutes: number,
  ) =>
    (occupiedByDay.get(day) ?? []).filter((occupied) => {
      const slotStart = toMinutes(startTime);
      const occupiedStart = toMinutes(occupied.startTime);
      return (
        slotStart < occupiedStart + occupied.durationMinutes &&
        occupiedStart < slotStart + durationMinutes
      );
    });

  const pickSmartInitialTime = (
    day: ScheduleSlot["day"],
    durationMinutes: number,
  ): string => {
    const preferred =
      day === "sat" || day === "sun"
        ? ["10:00", "09:00", "11:00", "14:00", "15:00", "16:00", "19:00"]
        : ["19:00", "20:00", "18:00", "21:00", "08:00", "07:00", "14:00"];
    for (const candidate of preferred) {
      if (checkTimeOverlap(day, candidate, durationMinutes).length === 0) {
        return candidate;
      }
    }
    return preferred[0];
  };

  const [slots, setSlots] = useState<ScheduleSlot[]>(() =>
    (["mon", "wed", "sat"] as const).map((day) => ({
      day,
      startTime: pickSmartInitialTime(day, initialDuration),
      durationMinutes: initialDuration,
    })),
  );
  const [customDrafts, setCustomDrafts] = useState<
    Partial<Record<ScheduleSlot["day"], string>>
  >({});
  const [openTimePickerDay, setOpenTimePickerDay] = useState<
    ScheduleSlot["day"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!openTimePickerDay) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-time-picker]")) {
        setOpenTimePickerDay(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenTimePickerDay(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openTimePickerDay]);

  const findConflictsForSlot = (slot: ScheduleSlot) =>
    checkTimeOverlap(slot.day, slot.startTime, slot.durationMinutes);

  const findConflict = (slot: ScheduleSlot) => findConflictsForSlot(slot)[0];

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
        if (openTimePickerDay === day) {
          setOpenTimePickerDay(null);
        }
        return prev.filter((s) => s.day !== day);
      }
      const next = [
        ...prev,
        {
          day,
          startTime: pickSmartInitialTime(day, initialDuration),
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
    setError(null);
    setSlots((prev) =>
      prev.map((slot) => (slot.day === day ? { ...slot, ...patch } : slot)),
    );
  };

  const applySlotToAll = (source: ScheduleSlot) => {
    setError(null);
    setCustomDrafts({});
    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        startTime: source.startTime,
        durationMinutes: source.durationMinutes,
      })),
    );
    setOpenTimePickerDay(null);
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

  const hasAnyConflict = slots.some((slot) => Boolean(findConflict(slot)));

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
    const conflicting = slots.find((slot) => findConflict(slot));
    if (conflicting) {
      const dayMeta = WEEK_DAYS.find((d) => d.key === conflicting.day);
      const occupied = findConflict(conflicting);
      setError(
        `${dayMeta?.full} às ${conflicting.startTime} conflita com outro plano seu (${occupied?.startTime}–${formatMinutes(
          toMinutes(occupied?.startTime ?? "0:00") +
            (occupied?.durationMinutes ?? 0),
        )}). Escolha outro horário`,
      );
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
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-[#646B82]">
              <Calendar className="size-4 text-[#5B8DEF]" />
              Dias da semana
            </span>
            {slots.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-[#F3EFE6] px-2.5 py-1 font-sans text-xs font-medium text-[#2D3142]/80 tabular-nums">
                {formattedTotal}/semana
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEK_DAYS.map((day) => {
              const selectedSlot = slots.find((s) => s.day === day.key);
              const isSelected = Boolean(selectedSlot);
              const isConflicting = selectedSlot
                ? Boolean(findConflict(selectedSlot))
                : false;

              return (
                <button
                  key={day.key}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => toggleDay(day.key)}
                  aria-pressed={isSelected}
                  className={`relative h-10 rounded-xl font-sans text-xs font-semibold transition-colors cursor-pointer ${
                    isConflicting
                      ? "bg-[#FDF2F2] text-[#C85A54] border border-[#C85A54]/60 hover:bg-[#FCE8E8]"
                      : isSelected
                        ? "bg-[#5B8DEF] text-[#FFFFFF] hover:bg-[#4B7DE0]"
                        : "bg-[#F3EFE6]/70 text-[#646B82] hover:bg-[#E8F0FE] hover:text-[#5B8DEF]"
                  }`}
                >
                  {day.short}
                  {isConflicting && (
                    <>
                      <span
                        aria-hidden
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-[#C85A54]"
                      />
                      <span className="sr-only">
                        (horário em conflito neste dia)
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {slots.length > 0 && (
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-[#646B82]">
              <Clock className="size-4 text-[#5B8DEF]" />
              Horário e duração
            </span>

            <ul className="space-y-2.5">
              {slots.map((slot) => {
                const dayMeta = WEEK_DAYS.find((d) => d.key === slot.day);
                const draft = customDrafts[slot.day];
                const isPreset =
                  draft === undefined &&
                  DURATION_OPTIONS.includes(slot.durationMinutes);
                const customValue =
                  draft ?? (isPreset ? "" : String(slot.durationMinutes));
                const slotConflicts = findConflictsForSlot(slot);
                const hasConflict = slotConflicts.length > 0;
                const slotEnd = formatMinutes(
                  toMinutes(slot.startTime) + slot.durationMinutes,
                );
                const isPickerOpen = openTimePickerDay === slot.day;
                const [currentHour = "19", currentMinute = "00"] =
                  slot.startTime.split(":");
                const dayOccupiedList = occupiedByDay.get(slot.day) ?? [];

                return (
                  <li
                    key={slot.day}
                    data-time-picker
                    className={`rounded-2xl border p-3.5 sm:px-4 sm:py-3 transition-colors ${
                      hasConflict
                        ? "bg-[#FDF2F2] border-[#C85A54]/50"
                        : isPickerOpen
                          ? "bg-[#FFFFFF] border-[#5B8DEF]"
                          : "bg-[#FFFFFF] border-[#2D3142]/8"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`w-16 font-sans text-[13px] font-semibold ${
                          hasConflict ? "text-[#C85A54]" : "text-[#2D3142]"
                        }`}
                      >
                        {dayMeta?.full}
                      </span>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        aria-expanded={isPickerOpen}
                        aria-label={`Escolher horário de ${dayMeta?.full}`}
                        onClick={() =>
                          setOpenTimePickerDay((prev) =>
                            prev === slot.day ? null : slot.day,
                          )
                        }
                        className={`h-9 rounded-xl border px-3 font-sans text-xs font-semibold tabular-nums inline-flex items-center gap-2 cursor-pointer transition-colors ${
                          hasConflict
                            ? "bg-[#FFFFFF] border-[#C85A54]/60 text-[#C85A54] hover:bg-[#FCE8E8]/50"
                            : isPickerOpen
                              ? "bg-[#E8F0FE] border-[#5B8DEF] text-[#5B8DEF]"
                              : "bg-[#F3EFE6]/75 border-transparent text-[#2D3142] hover:bg-[#E8F0FE] hover:text-[#5B8DEF]"
                        }`}
                      >
                        <Clock
                          className={`size-3.5 ${
                            hasConflict
                              ? "text-[#C85A54]"
                              : "text-[#5B8DEF]"
                          }`}
                        />
                        <span>
                          {slot.startTime}
                          <span
                            className={`font-normal ${
                              hasConflict
                                ? "text-[#C85A54]/80"
                                : isPickerOpen
                                  ? "text-[#5B8DEF]/80"
                                  : "text-[#646B82]"
                            }`}
                          >
                            {" "}
                            – {slotEnd}
                          </span>
                        </span>
                        <ChevronDown
                          className={`size-3.5 transition-transform duration-150 ${
                            isPickerOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-1 sm:ml-auto">
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
                                updateSlot(slot.day, {
                                  durationMinutes: minutes,
                                });
                              }}
                              className={`h-8 flex-1 sm:flex-none px-2.5 rounded-lg font-sans text-xs tabular-nums transition-colors cursor-pointer ${
                                active
                                  ? hasConflict
                                    ? "bg-[#C85A54] text-[#FFFFFF] font-semibold"
                                    : "bg-[#E8F0FE] text-[#5B8DEF] font-semibold"
                                  : "text-[#646B82] hover:bg-[#F3EFE6] hover:text-[#2D3142]"
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
                          className={`h-8 w-14 rounded-lg border text-center font-sans text-xs tabular-nums placeholder:text-[#646B82]/60 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            !isPreset
                              ? hasConflict
                                ? "bg-[#FFFFFF] border-[#C85A54] text-[#C85A54] font-semibold"
                                : "bg-[#E8F0FE] border-[#5B8DEF]/40 text-[#5B8DEF] font-semibold"
                              : "bg-transparent border-[#2D3142]/12 text-[#2D3142] hover:bg-[#F3EFE6]/60 focus:border-[#5B8DEF] focus:bg-[#E8F0FE]"
                          }`}
                        />
                      </div>
                    </div>

                    {isPickerOpen && (
                      <div className="mt-3 pt-3 border-t border-[#2D3142]/8 space-y-3">
                        <div className="space-y-2">
                          {TIME_PERIODS.map((period) => (
                            <div
                              key={period.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2"
                            >
                              <span className="w-12 shrink-0 font-sans text-xs font-medium text-[#646B82]">
                                {period.label}
                              </span>
                              <div className="grid grid-cols-5 gap-1.5 flex-1">
                                {period.times.map((presetTime) => {
                                  const isSelectedTime =
                                    slot.startTime === presetTime;
                                  const presetConflicts =
                                    checkTimeOverlap(
                                      slot.day,
                                      presetTime,
                                      slot.durationMinutes,
                                    ).length > 0;

                                  return (
                                    <button
                                      key={presetTime}
                                      type="button"
                                      onClick={() => {
                                        updateSlot(slot.day, {
                                          startTime: presetTime,
                                        });
                                        if (!presetConflicts) {
                                          setOpenTimePickerDay(null);
                                        }
                                      }}
                                      className={`h-8 rounded-lg font-sans text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                                        isSelectedTime
                                          ? presetConflicts
                                            ? "bg-[#C85A54] text-[#FFFFFF] font-semibold"
                                            : "bg-[#5B8DEF] text-[#FFFFFF] font-semibold"
                                          : presetConflicts
                                            ? "bg-[#FDF2F2] text-[#C85A54] border border-[#C85A54]/35 hover:bg-[#FCE8E8]"
                                            : "bg-[#F3EFE6]/70 text-[#2D3142] hover:bg-[#E8F0FE] hover:text-[#5B8DEF]"
                                      }`}
                                    >
                                      {presetTime}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2D3142]/6">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-sans text-xs font-medium text-[#646B82]">
                              Horário exato
                            </span>
                            <div className="inline-flex items-center rounded-lg bg-[#F3EFE6]/80 p-0.5">
                              <input
                                type="number"
                                min={0}
                                max={23}
                                aria-label={`Hora de ${dayMeta?.full}`}
                                value={currentHour}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
                                  if (!raw) return;
                                  const num = Math.min(23, Math.max(0, Number.parseInt(raw, 10)));
                                  updateSlot(slot.day, {
                                    startTime: `${String(num).padStart(2, "0")}:${currentMinute}`,
                                  });
                                }}
                                className="h-7 w-9 rounded-md bg-[#FFFFFF] text-center font-sans text-xs font-semibold text-[#2D3142] tabular-nums focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="font-sans text-xs font-semibold text-[#646B82] px-1">
                                :
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={59}
                                aria-label={`Minuto de ${dayMeta?.full}`}
                                value={currentMinute}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
                                  if (!raw) return;
                                  const num = Math.min(59, Math.max(0, Number.parseInt(raw, 10)));
                                  updateSlot(slot.day, {
                                    startTime: `${currentHour}:${String(num).padStart(2, "0")}`,
                                  });
                                }}
                                className="h-7 w-9 rounded-md bg-[#FFFFFF] text-center font-sans text-xs font-semibold text-[#2D3142] tabular-nums focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <div className="inline-flex items-center gap-0.5 pl-1.5">
                                {MINUTE_STEPS.map((m) => {
                                  const isMinuteActive = currentMinute === m;
                                  return (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() =>
                                        updateSlot(slot.day, {
                                          startTime: `${currentHour}:${m}`,
                                        })
                                      }
                                      className={`h-7 px-2 rounded-md font-sans text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                                        isMinuteActive
                                          ? "bg-[#FFFFFF] text-[#5B8DEF] font-semibold"
                                          : "text-[#646B82] hover:bg-[#FFFFFF]/70 hover:text-[#2D3142]"
                                      }`}
                                    >
                                      :{m}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {slots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => applySlotToAll(slot)}
                              className="h-7 px-2.5 rounded-lg bg-[#E8F0FE] hover:bg-[#d8e6fd] font-sans text-xs font-medium text-[#5B8DEF] transition-colors cursor-pointer"
                            >
                              Repetir {slot.startTime} ({slot.durationMinutes}m)
                              em todos os dias
                            </button>
                          )}
                        </div>

                        {dayOccupiedList.length > 0 && !hasConflict && (
                          <p className="font-sans font-medium text-[0.7rem] text-[#646B82]/60 tabular-nums">
                            Ocupado em {dayMeta?.full.toLowerCase()}:{" "}
                            {dayOccupiedList
                              .map(
                                (occ) =>
                                  `${occ.startTime}–${formatMinutes(
                                    toMinutes(occ.startTime) +
                                      occ.durationMinutes,
                                  )}`,
                              )
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    )}

                    {hasConflict && (
                      <p className="mt-4 font-sans text-[0.7rem] font-medium text-[#C85A54] tabular-nums flex items-center gap-1.5">
                        <TriangleExclamation className="size-3 shrink-0" />
                        <span>
                          Conflito com outro plano seu:{" "}
                          {slotConflicts
                            .map(
                              (occupied) =>
                                `${occupied.startTime}–${formatMinutes(
                                  toMinutes(occupied.startTime) +
                                    occupied.durationMinutes,
                                )}`,
                            )
                            .join(", ")}
                        </span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="font-sans text-xs font-medium text-[#C85A54]">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-1">
        <span className="text-center sm:text-left font-sans text-xs text-[#646B82] tabular-nums">
          {slots.length}{" "}
          {slots.length === 1 ? "sessão por semana" : "sessões por semana"}
        </span>

        <Button
          type="submit"
          isDisabled={isSubmitting || slots.length === 0 || hasAnyConflict}
          className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[#FF9B85] hover:bg-[#ff8a70] disabled:opacity-50 font-sans text-[#FFFFFF] font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>{isSubmitting ? "Salvando..." : "Confirmar rotina"}</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}


