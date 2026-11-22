import type {
  QuestionAnswer,
  QuestionPayload,
} from "@/app/components/ai/types";

export interface AgentConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export function serializeQuestionMessage(question: QuestionPayload): string {
  return JSON.stringify(question);
}

export function parseStoredQuestion(content: string): QuestionPayload | null {
  try {
    const parsed = JSON.parse(content) as Partial<QuestionPayload>;
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.question === "string" &&
      typeof parsed.inputType === "string"
    ) {
      return parsed as QuestionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

function resolveOptionLabel(
  optionId: string,
  lastQuestion?: QuestionPayload | null,
): string {
  const match = lastQuestion?.options?.find((opt) => opt.id === optionId);
  if (!match) return optionId;
  return match.description
    ? `${match.label} (${match.description})`
    : match.label;
}

export function formatAnswerToText(
  answer: QuestionAnswer,
  lastQuestion?: QuestionPayload | null,
): string {
  switch (answer.inputType) {
    case "text":
      return answer.value.trim();

    case "single_choice": {
      if (answer.value === "custom" && answer.customText) {
        return answer.customText.trim();
      }
      return resolveOptionLabel(answer.value, lastQuestion);
    }

    case "multi_choice": {
      const labels = answer.values.map((id) =>
        resolveOptionLabel(id, lastQuestion),
      );
      if (answer.customText?.trim()) {
        labels.push(answer.customText.trim());
      }
      return labels.join("; ");
    }

    case "schedule_picker":
      return answer.slots
        .map(
          (slot) =>
            `${slot.day} às ${slot.startTime} (${slot.durationMinutes} min)`,
        )
        .join(", ");
  }
}

export function formatHistoryForAgent(
  messages: Array<{ role: "USER" | "ASSISTANT"; content: string }>,
): AgentConversationMessage[] {
  return messages.map((message) => {
    if (message.role === "USER") {
      return { role: "user", content: message.content };
    }

    const parsed = parseStoredQuestion(message.content);
    if (!parsed) {
      return { role: "assistant", content: message.content };
    }

    const optionsSummary = parsed.options?.length
      ? ` Opções oferecidas: ${parsed.options.map((o) => o.label).join(" | ")}`
      : "";

    return {
      role: "assistant",
      content: `${parsed.question}${optionsSummary}`,
    };
  });
}
