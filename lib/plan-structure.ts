export type TaskStatus = "pending" | "in_progress" | "completed";
export type DifficultyFeedback = "easy" | "just_right" | "hard";

export interface PlanTaskExecution {
  status?: TaskStatus;
  completedSteps?: number[];
  completedAt?: string | null;
  difficultyFeedback?: DifficultyFeedback | null;
}

export interface PlanTaskVideo {
  youtubeId: string;
  title: string;
  channel?: string;
  watchStartSeconds?: number;
  watchEndSeconds?: number;
  transcriptSummary?: string;
}

export interface PlanTaskContent {
  video?: PlanTaskVideo | null;
  steps?: string[];
}

export interface PlanTask extends PlanTaskExecution {
  taskId: string;
  order: number;
  title: string;
  whyItMatters: string;
  schedule: {
    date: string; // YYYY-MM-DD
    dayOfWeek: string; // monday..sunday
    startTime: string; // HH:mm
    durationMinutes: number;
    timeBreakdown?: {
      consumeMinutes: number;
      practiceMinutes: number;
    };
  };
  lockState?: {
    isLocked: boolean;
    unlockAt?: string;
  };
  pedagogy?: {
    taskType?: string;
    requiredTools?: string[];
  };
  backgroundWorker?: {
    enrichmentStatus?: string;
    searchQueryUsed?: string;
    jevAlignmentScore?: number | null;
  };
  content?: PlanTaskContent | null;
}

export interface RoutineSlot {
  dayOfWeek: string;
  startTime: string;
  maxMinutes: number;
  energyLevel?: string;
}

export interface RoutineContract {
  timezone: string;
  totalWeeks: number;
  weeklyHours: number;
  slots: RoutineSlot[];
}

export interface PlanObjective {
  rawInput: string;
  clearGoal: string;
  successCriteria: string[];
}

export interface PlanStructure {
  planId?: string;
  status?: string;
  objective?: PlanObjective;
  routineContract?: RoutineContract;
  tasks: PlanTask[];
}

export interface ActivePlanRecord {
  id: string;
  stage: string;
  rawInput: string;
  refinedGoal: string | null;
  totalTasks: number;
  completedTasks: number;
  planStructure: unknown;
}

export interface ResolvedNextTask {
  planId: string;
  planTitle: string;
  planTotalTasks: number;
  planCompletedTasks: number;
  currentWeek: number;
  totalWeeks: number;
  task: PlanTask;
  isTodayOrPast: boolean;
  isUnlocked: boolean;
  isEnriched: boolean;
  nextReschedulePreview: {
    date: string;
    dayOfWeek: string;
    startTime: string;
    formattedLabel: string;
  } | null;
}

export interface WeekDaySession {
  planId: string;
  planTitle: string;
  taskId: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  status: TaskStatus;
  isLocked: boolean;
}

export interface WeekStripDay {
  dateIso: string;
  shortLabel: string; // Seg, Ter...
  dayNumber: number;
  isToday: boolean;
  sessions: WeekDaySession[];
}

export interface WeeklyRhythm {
  completed: number;
  scheduled: number;
}

const DAY_INDEX_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const INDEX_TO_DAY_NAME = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export const DAY_NAME_PT: Record<string, string> = {
  sunday: "Domingo",
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
};

const SHORT_DAY_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export function parsePlanStructure(raw: unknown): PlanStructure | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const tasks = Array.isArray(obj.tasks) ? (obj.tasks as PlanTask[]) : [];
  return {
    planId: typeof obj.planId === "string" ? obj.planId : undefined,
    status: typeof obj.status === "string" ? obj.status : undefined,
    objective: obj.objective as PlanObjective | undefined,
    routineContract: obj.routineContract as RoutineContract | undefined,
    tasks,
  };
}

export function getTodayIsoInTimezone(timezone = "America/Sao_Paulo"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function parseIsoDateParts(dateIso: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateIso.split("-").map(Number);
  return {
    year: y || 2026,
    month: m || 1,
    day: d || 1,
  };
}

export function dateFromIsoUtc(dateIso: string): Date {
  const { year, month, day } = parseIsoDateParts(dateIso);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function toIsoUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysIso(dateIso: string, days: number): string {
  const dt = dateFromIsoUtc(dateIso);
  dt.setUTCDate(dt.getUTCDate() + days);
  return toIsoUtc(dt);
}

export function formatDayMonthPt(dateIso: string): string {
  const { month, day } = parseIsoDateParts(dateIso);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

export function formatWeekdayAndDatePt(dateIso: string): string {
  const dt = dateFromIsoUtc(dateIso);
  const dayName = DAY_NAME_PT[INDEX_TO_DAY_NAME[dt.getUTCDay()]] ?? "";
  return `${dayName}, ${formatDayMonthPt(dateIso)}`;
}

export function getTaskStatus(task: PlanTask): TaskStatus {
  if (task.status === "completed" || task.status === "in_progress") {
    return task.status;
  }
  return "pending";
}

export function isTaskUnlockedForDate(task: PlanTask, todayIso: string): boolean {
  const taskDate = task.schedule?.date;
  if (!taskDate) return true;
  if (taskDate <= todayIso) return true;
  return task.lockState?.isLocked === false;
}

export function isTaskEnriched(task: PlanTask): boolean {
  const status = task.backgroundWorker?.enrichmentStatus;
  if (!status) {
    return Boolean(task.content && (task.content.video || (task.content.steps?.length ?? 0) > 0));
  }
  return status === "completed";
}

export function getPlanDisplayTitle(plan: Pick<ActivePlanRecord, "refinedGoal" | "rawInput">, structure?: PlanStructure | null): string {
  return structure?.objective?.clearGoal || plan.refinedGoal || plan.rawInput;
}

export function computeNextRescheduleSlot(
  routineContract: RoutineContract | undefined,
  afterDateIso: string,
): { date: string; dayOfWeek: string; startTime: string; formattedLabel: string } | null {
  const slots = routineContract?.slots;
  if (!slots || slots.length === 0) {
    const nextDate = addDaysIso(afterDateIso, 1);
    const dt = dateFromIsoUtc(nextDate);
    const dayOfWeek = INDEX_TO_DAY_NAME[dt.getUTCDay()];
    return {
      date: nextDate,
      dayOfWeek,
      startTime: "19:00",
      formattedLabel: `${formatWeekdayAndDatePt(nextDate)} às 19:00`,
    };
  }

  for (let offset = 1; offset <= 14; offset++) {
    const candidateIso = addDaysIso(afterDateIso, offset);
    const dt = dateFromIsoUtc(candidateIso);
    const dayIdx = dt.getUTCDay();
    const matchingSlot = slots.find(
      (s) => DAY_INDEX_MAP[s.dayOfWeek.toLowerCase()] === dayIdx,
    );
    if (matchingSlot) {
      return {
        date: candidateIso,
        dayOfWeek: matchingSlot.dayOfWeek.toLowerCase(),
        startTime: matchingSlot.startTime,
        formattedLabel: `${formatWeekdayAndDatePt(candidateIso)} às ${matchingSlot.startTime}`,
      };
    }
  }

  return null;
}

export function rescheduleRemainingTasks(
  structure: PlanStructure,
  targetTaskId: string,
  todayIso: string,
): PlanStructure {
  const tasks = [...structure.tasks];
  const targetIndex = tasks.findIndex((t) => t.taskId === targetTaskId);
  if (targetIndex === -1) return structure;

  let cursorDate = todayIso;
  const targetTaskDate = tasks[targetIndex].schedule?.date;
  if (targetTaskDate && targetTaskDate > cursorDate) {
    cursorDate = targetTaskDate;
  }

  for (let i = targetIndex; i < tasks.length; i++) {
    const task = tasks[i];
    if (getTaskStatus(task) === "completed") continue;

    const nextSlot = computeNextRescheduleSlot(structure.routineContract, cursorDate);
    if (!nextSlot) break;

    tasks[i] = {
      ...task,
      schedule: {
        ...task.schedule,
        date: nextSlot.date,
        dayOfWeek: nextSlot.dayOfWeek,
        startTime: nextSlot.startTime,
      },
      lockState: {
        isLocked: nextSlot.date > todayIso,
        unlockAt: `${nextSlot.date}T00:00:00-03:00`,
      },
    };
    cursorDate = nextSlot.date;
  }

  return {
    ...structure,
    tasks,
  };
}

export function selectNextTask(
  activePlans: ActivePlanRecord[],
  todayIso: string,
): { nextTask: ResolvedNextTask | null; completedToday: boolean } {
  let best: ResolvedNextTask | null = null;
  let bestSortKey = "";
  let completedTodayCount = 0;
  let pendingTodayCount = 0;

  for (const plan of activePlans) {
    const structure = parsePlanStructure(plan.planStructure);
    if (!structure || structure.tasks.length === 0) continue;

    const planTitle = getPlanDisplayTitle(plan, structure);
    const totalTasks = structure.tasks.length;
    const completedTasks = structure.tasks.filter((t) => getTaskStatus(t) === "completed").length;
    const totalWeeks = structure.routineContract?.totalWeeks || Math.max(1, Math.ceil(totalTasks / 3));

    const firstDate = structure.tasks[0]?.schedule?.date;

    for (const task of structure.tasks) {
      const status = getTaskStatus(task);
      const taskDate = task.schedule?.date ?? todayIso;

      if (taskDate === todayIso) {
        if (status === "completed") completedTodayCount++;
        else pendingTodayCount++;
      }

      if (status === "completed") continue;

      const sortKey = `${taskDate}T${task.schedule?.startTime ?? "00:00"}_${String(task.order).padStart(4, "0")}`;

      if (!best || sortKey < bestSortKey) {
        bestSortKey = sortKey;
        const isTodayOrPast = taskDate <= todayIso;
        const isUnlocked = isTaskUnlockedForDate(task, todayIso);
        const isEnriched = isTaskEnriched(task);

        let currentWeek = 1;
        if (firstDate && taskDate) {
          const diffDays = Math.max(
            0,
            Math.floor(
              (dateFromIsoUtc(taskDate).getTime() - dateFromIsoUtc(firstDate).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          );
          currentWeek = Math.min(totalWeeks, Math.floor(diffDays / 7) + 1);
        }

        const nextReschedulePreview = isTodayOrPast
          ? computeNextRescheduleSlot(structure.routineContract, todayIso)
          : null;

        best = {
          planId: plan.id,
          planTitle,
          planTotalTasks: totalTasks,
          planCompletedTasks: completedTasks,
          currentWeek,
          totalWeeks,
          task,
          isTodayOrPast,
          isUnlocked,
          isEnriched,
          nextReschedulePreview,
        };
      }
    }
  }

  const completedToday = completedTodayCount > 0 && pendingTodayCount === 0;
  return { nextTask: best, completedToday };
}

export function buildWeekStrip(
  activePlans: ActivePlanRecord[],
  todayIso: string,
): { days: WeekStripDay[]; rhythm: WeeklyRhythm } {
  const todayDt = dateFromIsoUtc(todayIso);
  const jsDay = todayDt.getUTCDay(); // 0=Sun..6=Sat
  const offsetToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const mondayIso = addDaysIso(todayIso, offsetToMonday);

  const dayMap = new Map<string, WeekStripDay>();
  const orderedDates: string[] = [];

  for (let i = 0; i < 7; i++) {
    const dateIso = addDaysIso(mondayIso, i);
    const dt = dateFromIsoUtc(dateIso);
    orderedDates.push(dateIso);
    dayMap.set(dateIso, {
      dateIso,
      shortLabel: SHORT_DAY_PT[dt.getUTCDay()],
      dayNumber: dt.getUTCDate(),
      isToday: dateIso === todayIso,
      sessions: [],
    });
  }

  let completed = 0;
  let scheduled = 0;

  for (const plan of activePlans) {
    const structure = parsePlanStructure(plan.planStructure);
    if (!structure) continue;
    const planTitle = getPlanDisplayTitle(plan, structure);

    for (const task of structure.tasks) {
      const dateIso = task.schedule?.date;
      if (!dateIso || !dayMap.has(dateIso)) continue;

      const status = getTaskStatus(task);
      scheduled++;
      if (status === "completed") completed++;

      dayMap.get(dateIso)!.sessions.push({
        planId: plan.id,
        planTitle,
        taskId: task.taskId,
        title: task.title,
        startTime: task.schedule?.startTime ?? "",
        durationMinutes: task.schedule?.durationMinutes ?? 30,
        status,
        isLocked: !isTaskUnlockedForDate(task, todayIso),
      });
    }
  }

  const days = orderedDates.map((d) => {
    const entry = dayMap.get(d)!;
    entry.sessions.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return entry;
  });

  return {
    days,
    rhythm: { completed, scheduled },
  };
}

export interface WeekGroup {
  weekNumber: number;
  tasks: PlanTask[];
}

export function groupTasksByWeek(tasks: PlanTask[]): WeekGroup[] {
  if (tasks.length === 0) return [];
  const sorted = [...tasks].sort((a, b) => {
    const dateCmp = (a.schedule?.date ?? "").localeCompare(b.schedule?.date ?? "");
    return dateCmp !== 0 ? dateCmp : a.order - b.order;
  });

  const firstDate = sorted[0].schedule?.date;
  const groups = new Map<number, PlanTask[]>();

  for (const task of sorted) {
    let weekNumber = 1;
    if (firstDate && task.schedule?.date) {
      const diffDays = Math.max(
        0,
        Math.floor(
          (dateFromIsoUtc(task.schedule.date).getTime() - dateFromIsoUtc(firstDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      weekNumber = Math.floor(diffDays / 7) + 1;
    }
    if (!groups.has(weekNumber)) {
      groups.set(weekNumber, []);
    }
    groups.get(weekNumber)!.push(task);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekNumber, weekTasks]) => ({
      weekNumber,
      tasks: weekTasks,
    }));
}
