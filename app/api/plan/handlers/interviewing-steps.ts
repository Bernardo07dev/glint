import type { LearningPlan, PlanMessage, Prisma } from "@prisma/client";
import type {
  QuestionAnswer,
  QuestionPayload,
  StepProgress,
} from "@/app/components/ai/types";
import { runInterviewingStepsAgent } from "@/lib/agents/interviewing-steps";
import {
  formatAnswerToText,
  formatHistoryForAgent,
  parseStoredQuestion,
  serializeQuestionMessage,
  type ExecutableMeta,
} from "@/lib/agents/types";
import type { OccupiedSlot } from "@/lib/schedule/occupied-slots";
import { prisma } from "@/lib/infra/prisma";

type PlanWithMessages = LearningPlan & { messages: PlanMessage[] };

function attachOccupiedSlots(
  question: QuestionPayload,
  occupiedSlots?: OccupiedSlot[],
): QuestionPayload {
  if (question.inputType !== "schedule_picker" || !occupiedSlots?.length) {
    return question;
  }

  return { ...question, occupiedSlots };
}

function buildStepProgress(
  meta: ExecutableMeta,
  currentStepId: string | null,
): StepProgress {
  const activeId =
    currentStepId ??
    meta.steps.find((step) => step.status === "pending")?.id ??
    null;

  const steps = meta.steps.map((step) => ({
    id: step.id,
    goal: step.questionGoal,
    status:
      step.status === "completed"
        ? ("completed" as const)
        : step.id === activeId
          ? ("current" as const)
          : ("pending" as const),
  }));

  const completedSteps = steps.filter(
    (step) => step.status === "completed",
  ).length;

  return {
    completedSteps,
    totalSteps: steps.length,
    steps,
  };
}

export async function handleInterviewingStepsStage(
  plan: PlanWithMessages,
  executableMeta: ExecutableMeta,
  answer?: QuestionAnswer,
  occupiedSlots?: OccupiedSlot[],
) {
  const stageMessages = plan.messages.filter(
    (message) => message.stage === "INTERVIEWING_STEPS",
  );
  const lastAssistantMessage = [...stageMessages]
    .reverse()
    .find((message) => message.role === "ASSISTANT");
  const lastQuestion = lastAssistantMessage
    ? parseStoredQuestion(lastAssistantMessage.content)
    : null;

  let latestUserAnswer: string | undefined;
  let attemptsForCurrentStep = 0;

  if (answer) {
    latestUserAnswer = formatAnswerToText(answer, lastQuestion);
    const savedUserMessage = await prisma.planMessage.create({
      data: {
        planId: plan.id,
        role: "USER",
        stage: "INTERVIEWING_STEPS",
        stepId: plan.currentStepId,
        content: latestUserAnswer,
      },
    });
    stageMessages.push(savedUserMessage);

    attemptsForCurrentStep = stageMessages.filter(
      (message) =>
        message.role === "USER" && message.stepId === plan.currentStepId,
    ).length;
  } else if (
    stageMessages.length > 0 &&
    stageMessages[stageMessages.length - 1]?.role === "ASSISTANT" &&
    lastQuestion
  ) {
    return {
      stage: "INTERVIEWING_STEPS" as const,
      refinedGoal: plan.refinedGoal,
      question: attachOccupiedSlots(lastQuestion, occupiedSlots),
      stepProgress: buildStepProgress(executableMeta, plan.currentStepId),
    };
  }

  const result = await runInterviewingStepsAgent({
    refinedGoal: plan.refinedGoal ?? plan.rawInput,
    executableMeta,
    currentStepId: plan.currentStepId,
    messages: formatHistoryForAgent(stageMessages),
    latestUserAnswer,
    attemptsForCurrentStep,
  });

  if (result.status === "NEEDS_USER_INPUT") {
    await prisma.learningPlan.update({
      where: { id: plan.id },
      data: {
        executableMeta:
          result.executableMeta as unknown as Prisma.InputJsonValue,
        currentStepId: result.currentStepId,
      },
    });

    await prisma.planMessage.create({
      data: {
        planId: plan.id,
        role: "ASSISTANT",
        stage: "INTERVIEWING_STEPS",
        stepId: result.currentStepId,
        content: serializeQuestionMessage(result.question),
      },
    });

    return {
      stage: "INTERVIEWING_STEPS" as const,
      refinedGoal: plan.refinedGoal,
      question: attachOccupiedSlots(result.question, occupiedSlots),
      stepProgress: buildStepProgress(
        result.executableMeta,
        result.currentStepId,
      ),
    };
  }

  await prisma.learningPlan.update({
    where: { id: plan.id },
    data: {
      executableMeta:
        result.executableMeta as unknown as Prisma.InputJsonValue,
      currentStepId: null,
      stage: "GENERATING_TASKS",
    },
  });

  return {
    stage: "GENERATING_TASKS" as const,
    refinedGoal: plan.refinedGoal,
    stageCompleted: "INTERVIEWING_STEPS" as const,
    executableMeta: result.executableMeta,
    stepProgress: buildStepProgress(result.executableMeta, null),
  };
}
