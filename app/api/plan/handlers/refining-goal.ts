import type { LearningPlan, PlanMessage } from "@prisma/client";
import type { QuestionAnswer } from "@/app/components/ai/types";
import { runRefiningGoalAgent } from "@/lib/agents/refining-goal";
import {
  formatAnswerToText,
  formatHistoryForAgent,
  parseStoredQuestion,
  serializeQuestionMessage,
} from "@/lib/agents/types";
import { prisma } from "@/lib/prisma";

type PlanWithMessages = LearningPlan & { messages: PlanMessage[] };

export async function handleRefiningGoalStage(
  plan: PlanWithMessages,
  answer?: QuestionAnswer,
) {
  const stageMessages = plan.messages.filter(
    (message) => message.stage === "REFINING_GOAL",
  );
  const lastAssistantMessage = [...stageMessages]
    .reverse()
    .find((message) => message.role === "ASSISTANT");
  const lastQuestion = lastAssistantMessage
    ? parseStoredQuestion(lastAssistantMessage.content)
    : null;

  if (answer) {
    const answerText = formatAnswerToText(answer, lastQuestion);
    const savedUserMessage = await prisma.planMessage.create({
      data: {
        planId: plan.id,
        role: "USER",
        stage: "REFINING_GOAL",
        content: answerText,
      },
    });
    stageMessages.push(savedUserMessage);
  } else if (
    stageMessages.length > 0 &&
    stageMessages[stageMessages.length - 1]?.role === "ASSISTANT" &&
    lastQuestion
  ) {
    return {
      stage: plan.stage,
      refinedGoal: plan.refinedGoal,
      question: lastQuestion,
    };
  }

  const result = await runRefiningGoalAgent({
    rawInput: plan.rawInput,
    messages: formatHistoryForAgent(stageMessages),
  });

  if (result.status === "NEEDS_USER_INPUT") {
    await prisma.planMessage.create({
      data: {
        planId: plan.id,
        role: "ASSISTANT",
        stage: "REFINING_GOAL",
        content: serializeQuestionMessage(result.question),
      },
    });

    return {
      stage: "REFINING_GOAL" as const,
      refinedGoal: null,
      question: result.question,
      jevConfidence: result.jevConfidence,
    };
  }

  await prisma.learningPlan.update({
    where: { id: plan.id },
    data: {
      refinedGoal: result.refinedGoal,
      stage: "INTERVIEWING_STEPS",
    },
  });

  return {
    stage: "INTERVIEWING_STEPS" as const,
    refinedGoal: result.refinedGoal,
    stageCompleted: "REFINING_GOAL" as const,
    jevConfidence: result.jevConfidence,
  };
}
