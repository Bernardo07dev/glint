import { AnimatedLogo } from "@/app/components/animated-logo";
import { SchedulePreviewClient } from "./schedule-preview-client";

export default function SchedulePreviewPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#FFFDF8] font-sans text-[#2D3142] px-6 py-6 sm:px-10">
      <header className="w-full max-w-[1040px] mx-auto flex items-center justify-between">
        <AnimatedLogo className="h-11 w-auto" />
        <span className="font-sans text-xs font-medium text-[#646B82]">
          Preview · QuestionSchedule
        </span>
      </header>

      <div className="my-auto py-8 w-full max-w-[640px] mx-auto">
        <SchedulePreviewClient />
      </div>

      <div aria-hidden="true" className="h-4" />
    </main>
  );
}
