"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@gravity-ui/icons";
import type {
  ResolvedNextTask,
  WeekStripWeek,
  WeeklyRhythm,
} from "@/lib/plan/plan-structure";
import { NextTaskHero } from "./components/next-task-hero";
import { WeekStrip } from "./components/week-strip";
import { ContextPanel, MentorNote } from "./components/context-panel";
import { RescheduleModal } from "./components/reschedule-modal";

interface InCreationBanner {
  id: string;
  rawInput: string;
}

interface HomeClientProps {
  inCreationPlan: InCreationBanner | null;
  nextTask: ResolvedNextTask | null;
  completedToday: boolean;
  weeks: WeekStripWeek[];
  rhythm: WeeklyRhythm;
}

export function HomeClient({
  inCreationPlan,
  nextTask,
  completedToday,
  weeks,
  rhythm,
}: HomeClientProps) {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

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

          <WeekStrip weeks={weeks} />

          {/* Recado do Mentor (mobile, acima do card de plano) */}
          <MentorNote
            nextTask={nextTask}
            completedToday={completedToday}
            className="flex lg:hidden"
          />

          <div className="space-y-3">
            <h2 className="font-display text-lg font-medium text-[#2D3142]">
              Próxima task
            </h2>
            <NextTaskHero
              nextTask={nextTask}
              completedToday={completedToday}
            />
          </div>
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
          isTodayOrPast={nextTask.isTodayOrPast}
          onClose={() => setIsRescheduleOpen(false)}
        />
      )}
    </div>
  );
}
