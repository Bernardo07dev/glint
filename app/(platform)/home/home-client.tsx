"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@gravity-ui/icons";
import type {
  ResolvedNextTask,
  WeekStripDay,
  WeeklyRhythm,
} from "@/lib/plan-structure";
import { NextTaskHero } from "./next-task-hero";
import { WeekStrip } from "./week-strip";
import { ContextPanel } from "./context-panel";
import { FocusSession } from "./focus-session";
import { RescheduleModal } from "./reschedule-modal";

interface InCreationBanner {
  id: string;
  rawInput: string;
}

interface HomeClientProps {
  inCreationPlan: InCreationBanner | null;
  nextTask: ResolvedNextTask | null;
  completedToday: boolean;
  weekDays: WeekStripDay[];
  rhythm: WeeklyRhythm;
}

export function HomeClient({
  inCreationPlan,
  nextTask,
  completedToday,
  weekDays,
  rhythm,
}: HomeClientProps) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  if (isFocusMode && nextTask) {
    return (
      <FocusSession
        nextTask={nextTask}
        onExit={() => setIsFocusMode(false)}
      />
    );
  }

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8 items-start">
        {/* Coluna Esquerda */}
        <div className="space-y-6 sm:space-y-8 min-w-0">
          {inCreationPlan && (
            <div className="rounded-2xl bg-[#E8F0FE]/70 border border-[#5B8DEF]/25 px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-[#2D3142] truncate">
                Você tem um plano esperando sua entrevista:{" "}
                <strong className="font-semibold">{inCreationPlan.rawInput}</strong>
              </p>
              <Link
                href={`/criacao-plano/${inCreationPlan.id}`}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#5B8DEF] hover:underline shrink-0 cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          )}

          <NextTaskHero
            nextTask={nextTask}
            completedToday={completedToday}
            onStartSession={() => setIsFocusMode(true)}
          />

          <WeekStrip days={weekDays} />
        </div>

        {/* Coluna Direita */}
        <ContextPanel
          rhythm={rhythm}
          nextTask={nextTask}
          completedToday={completedToday}
          onOpenReschedule={() => setIsRescheduleOpen(true)}
        />
      </div>

      {nextTask && nextTask.nextReschedulePreview && (
        <RescheduleModal
          open={isRescheduleOpen}
          planId={nextTask.planId}
          taskId={nextTask.task.taskId}
          taskTitle={nextTask.task.title}
          nextSlotLabel={nextTask.nextReschedulePreview.formattedLabel}
          onClose={() => setIsRescheduleOpen(false)}
        />
      )}
    </div>
  );
}
