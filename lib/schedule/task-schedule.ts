import type { TaskStatus } from "@prisma/client";
import { parseIsoDateParts } from "@/lib/plan/plan-structure";

export const DEFAULT_TIMEZONE = "America/Sao_Paulo";
export const DEFAULT_TRIGGER_LEAD_MINUTES = 10;

export function normalizeTimeZone(timeZone?: string | null): string {
  const candidate = timeZone?.trim();
  if (!candidate) return DEFAULT_TIMEZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate });
    return candidate;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function parseTimeHHmm(time: string): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return { hour: 20, minute: 0 };

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return { hour: 20, minute: 0 };
  }

  return { hour, minute };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const values: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  const hour = values.hour === 24 ? 0 : (values.hour ?? 0);
  const asUtcMs = Date.UTC(
    values.year,
    (values.month ?? 1) - 1,
    values.day ?? 1,
    hour,
    values.minute ?? 0,
    values.second ?? 0,
    0,
  );

  const alignedDateMs = Math.floor(date.getTime() / 1000) * 1000;
  return asUtcMs - alignedDateMs;
}

export function zonedDateTimeToUtc(
  dateIso: string,
  timeHHmm: string,
  timeZone?: string | null,
): Date {
  const tz = normalizeTimeZone(timeZone);
  const { year, month, day } = parseIsoDateParts(dateIso);
  const { hour, minute } = parseTimeHHmm(timeHHmm);

  const targetUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstGuess = new Date(
    targetUtcMs - getTimeZoneOffsetMs(new Date(targetUtcMs), tz),
  );
  const refinedGuess = new Date(
    targetUtcMs - getTimeZoneOffsetMs(firstGuess, tz),
  );

  return refinedGuess;
}

export function computeUnlockAt(
  scheduledDate: string,
  timeZone?: string | null,
): Date {
  return zonedDateTimeToUtc(scheduledDate, "00:00", timeZone);
}

export function computeTriggerAt(
  scheduledDate: string,
  startTime: string,
  timeZone?: string | null,
  leadMinutes = DEFAULT_TRIGGER_LEAD_MINUTES,
): Date {
  const scheduledAt = zonedDateTimeToUtc(scheduledDate, startTime, timeZone);
  return new Date(scheduledAt.getTime() - leadMinutes * 60_000);
}

export function resolveInitialTaskStatus(
  scheduledDate: string,
  isLocked: boolean,
  todayIso: string,
): TaskStatus {
  return !isLocked || scheduledDate <= todayIso ? "AVAILABLE" : "LOCKED";
}
