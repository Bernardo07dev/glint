import { runBlueprintAgent } from "./blueprint";
import { runConceptExplainerStepAgent } from "./concept-explainer-agent";
import { runQuizAndWalkthroughAgent } from "./quiz-and-walkthrough-agent";
import type {
  StepAgentTaskContext,
  StepsPlan,
  TaskContent,
} from "./types";
import { runVideoStepAgent } from "./video-agent";

export * from "./blueprint";
export * from "./concept-explainer-agent";
export * from "./quiz-and-walkthrough-agent";
export * from "./types";
export * from "./video-agent";

export interface RunEnrichTaskPipelineOptions {
  onBlueprintReady?: (stepsPlan: StepsPlan) => Promise<void> | void;
}

export interface RunEnrichTaskPipelineResult {
  stepsPlan: StepsPlan;
  content: TaskContent;
  jevAlignmentScore: number;
}

/**
 * Pure 3-stage JIT pipeline for enriching a single `PlanTask`:
 * 1. Blueprint (`stepsPlan`)
 * 2. Parallel tool resolution (`video` + `concept_explainer`)
 * 3. Quiz generation + `Tool -> Walkthrough` synthesis + Jev alignment score
 */
export async function runEnrichTaskPipeline(
  context: StepAgentTaskContext,
  options?: RunEnrichTaskPipelineOptions,
): Promise<RunEnrichTaskPipelineResult> {
  const stepsPlan = await runBlueprintAgent(context);
  if (options?.onBlueprintReady) {
    await options.onBlueprintReady(stepsPlan);
  }

  const videoStep = stepsPlan.steps.find((s) => s.tool === "video");
  const explainerStep = stepsPlan.steps.find(
    (s) => s.tool === "concept_explainer",
  );

  const [video, conceptExplainer] = await Promise.all([
    videoStep ? runVideoStepAgent({ context, step: videoStep }) : Promise.resolve(undefined),
    explainerStep
      ? runConceptExplainerStepAgent({ context, step: explainerStep })
      : Promise.resolve(undefined),
  ]);

  const { taskContent, jevAlignmentScore } = await runQuizAndWalkthroughAgent({
    context,
    stepsPlan,
    resolvedTools: {
      ...(video ? { video } : {}),
      ...(conceptExplainer ? { concept_explainer: conceptExplainer } : {}),
    },
  });

  return {
    stepsPlan,
    content: taskContent,
    jevAlignmentScore,
  };
}
