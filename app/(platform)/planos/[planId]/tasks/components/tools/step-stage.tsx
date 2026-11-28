"use client";

import type { StepQuizProgress } from "@/lib/tasks/step-progress";
import { VideoToolPlayer } from "./video-tool-player";
import { ConceptExplainer } from "./concept-explainer";
import { RecallQuiz, type LiveQuizState } from "./recall-quiz";
import type { ResolvedStep } from "./types";

interface StepStageProps {
  resolved: ResolvedStep;
  initialQuizProgress?: StepQuizProgress | null;
  onVideoEnded?: () => void;
  onQuizComplete?: (result: { correct: number; total: number }) => void;
  onQuizStateChange?: (state: LiveQuizState) => void;
  onQuizProgressChange?: (progress: StepQuizProgress) => void;
}

/** Palco do step: escolhe o componente pela `toolRef` e entrega o conteúdo vindo de `PlanTask.content.tools`. */
export function StepStage({
  resolved,
  initialQuizProgress,
  onVideoEnded,
  onQuizComplete,
  onQuizStateChange,
  onQuizProgressChange,
}: StepStageProps) {
  switch (resolved.toolRef) {
    case "video":
      return <VideoToolPlayer key={resolved.step.id} video={resolved.tool} onEnded={onVideoEnded} />;
    case "concept_explainer":
      return <ConceptExplainer explainer={resolved.tool} />;
    case "active_recall_quiz":
      return (
        <RecallQuiz
          key={resolved.step.id}
          quiz={resolved.tool}
          initialProgress={initialQuizProgress}
          onComplete={onQuizComplete}
          onStateChange={onQuizStateChange}
          onProgressChange={onQuizProgressChange}
        />
      );
  }
}
