import { parsePlanStructure } from "@/lib/plan-structure";
import { prisma } from "@/lib/prisma";
import { parseTimeHHmm } from "@/lib/task-schedule";

export interface OccupiedSlot {
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
}

const OCCUPYING_STAGES = ["ACTIVE", "ENRICHING_TASKS"] as const;
const OCCUPYING_STATUSES = ["LOCKED", "AVAILABLE", "IN_PROGRESS"] as const;

export async function getOccupiedSlots(
  userId: string,
  excludePlanId?: string,
): Promise<OccupiedSlot[]> {
  const [tasks, enrichingPlans] = await Promise.all([
    prisma.planTask.findMany({
      where: {
        plan: {
          userId,
          stage: { in: [...OCCUPYING_STAGES] },
          ...(excludePlanId ? { id: { not: excludePlanId } } : {}),
        },
        status: { in: [...OCCUPYING_STATUSES] },
      },
      select: {
        dayOfWeek: true,
        startTime: true,
        durationMinutes: true,
      },
    }),
    prisma.learningPlan.findMany({
      where: {
        userId,
        stage: "ENRICHING_TASKS",
        ...(excludePlanId ? { id: { not: excludePlanId } } : {}),
      },
      select: { planStructure: true },
    }),
  ]);

  const slots: OccupiedSlot[] = [...tasks];

  for (const plan of enrichingPlans) {
    const structure = parsePlanStructure(plan.planStructure);
    for (const task of structure?.tasks ?? []) {
      slots.push({
        dayOfWeek: task.schedule.dayOfWeek,
        startTime: task.schedule.startTime,
        durationMinutes: task.schedule.durationMinutes,
      });
    }
  }

  const unique = new Map<string, OccupiedSlot>();
  for (const slot of slots) {
    unique.set(
      `${slot.dayOfWeek}-${slot.startTime}-${slot.durationMinutes}`,
      slot,
    );
  }

  return [...unique.values()];
}

function toMinutes(startTime: string): number {
  const { hour, minute } = parseTimeHHmm(startTime);
  return hour * 60 + minute;
}

function rangesOverlap(
  a: OccupiedSlot,
  b: OccupiedSlot,
): boolean {
  const aStart = toMinutes(a.startTime);
  const bStart = toMinutes(b.startTime);
  return (
    aStart < bStart + b.durationMinutes && bStart < aStart + a.durationMinutes
  );
}

export function findScheduleConflicts(
  newSlots: OccupiedSlot[],
  occupiedSlots: OccupiedSlot[],
): OccupiedSlot[] {
  const conflicts = new Map<string, OccupiedSlot>();

  for (const slot of newSlots) {
    const hasConflict = occupiedSlots.some(
      (occupied) =>
        occupied.dayOfWeek === slot.dayOfWeek && rangesOverlap(slot, occupied),
    );

    if (hasConflict) {
      conflicts.set(`${slot.dayOfWeek}-${slot.startTime}`, slot);
    }
  }

  return [...conflicts.values()];
}
