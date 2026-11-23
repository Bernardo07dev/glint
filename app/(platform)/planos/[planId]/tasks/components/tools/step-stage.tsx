"use client";

import { VideoToolPlayer } from "./video-tool-player";
import { ConceptExplainer } from "./concept-explainer";
import { RecallQuiz } from "./recall-quiz";
import type { ResolvedStep } from "./types";

interface StepStageProps {
  resolved: ResolvedStep;
  onVideoEnded?: () => void;
  onQuizComplete?: (result: { correct: number; total: number }) => void;
}

/** Palco do step: escolhe o componente pela `toolRef` e entrega o conteúdo vindo de `PlanTask.content.tools`. */
export function StepStage({ resolved, onVideoEnded, onQuizComplete }: StepStageProps) {
  switch (resolved.toolRef) {
    case "video":
      return <VideoToolPlayer key={resolved.step.id} video={resolved.tool} onEnded={onVideoEnded} />;
    case "concept_explainer":
      return <ConceptExplainer explainer={resolved.tool} />;
    case "active_recall_quiz":
      return <RecallQuiz key={resolved.step.id} quiz={resolved.tool} onComplete={onQuizComplete} />;
  }
}
