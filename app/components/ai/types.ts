export type QuestionInputType =
  | "text"
  | "single_choice"
  | "multi_choice"
  | "schedule_picker";

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface QuestionPayload {
  id: string;
  question: string;
  helperText?: string;
  inputType: QuestionInputType;
  placeholder?: string;
  options?: QuestionOption[];
  allowCustom?: boolean;
  defaultDurationMinutes?: number;
}

export interface ScheduleSlot {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  startTime: string;
  durationMinutes: number;
}

export type QuestionAnswer =
  | { inputType: "text"; value: string }
  | { inputType: "single_choice"; value: string; customText?: string }
  | { inputType: "multi_choice"; values: string[]; customText?: string }
  | { inputType: "schedule_picker"; slots: ScheduleSlot[] };

export interface StepProgressItem {
  id: string;
  status: "completed" | "current" | "pending";
  goal?: string;
}

export interface StepProgress {
  completedSteps: number;
  totalSteps: number;
  steps: StepProgressItem[];
}
