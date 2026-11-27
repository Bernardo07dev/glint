import { stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { searchWebWithFirecrawlV2 } from "@/lib/infra/firecrawl";
import { models } from "@/lib/infra/llm";
import { prisma } from "@/lib/infra/prisma";
import { parseTaskContent, type TaskContent } from "@/lib/tasks/task-content";

export const maxDuration = 60;

const BeeRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
  liveStepContext: z.object({
    currentStepId: z.string().min(1),
    checkedWalkthroughIndices: z.array(z.number().int().nonnegative()).default([]),
    quizState: z
      .object({
        activeQuestionId: z.string().optional(),
        phase: z.enum(["answering", "confirmed"]).default("answering"),
        selectedOptionId: z.string().nullable().optional(),
      })
      .optional(),
  }),
});

export interface BeeSourceItem {
  title: string;
  url: string;
}

export type BeeStreamEvent =
  | { type: "status"; status: "searching" }
  | { type: "sources"; sources: BeeSourceItem[] }
  | { type: "text-delta"; text: string }
  | { type: "error"; message: string };

function getFirstName(fullName: string | null | undefined): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "aluno";
  return trimmed.split(/\s+/)[0];
}

function buildActiveToolContext(
  content: TaskContent,
  currentStepId: string,
  quizState?: {
    activeQuestionId?: string;
    phase: "answering" | "confirmed";
    selectedOptionId?: string | null;
  },
): string {
  const step = content.steps.find((s) => s.id === currentStepId) ?? content.steps[0];
  if (!step) return "";

  if (step.toolRef === "video" && content.tools.video) {
    const v = content.tools.video;
    const keyMomentsText = (v.keyMoments ?? [])
      .map((km) => `${km.timestampSeconds}s: ${km.label}`)
      .join(" | ");
    return [
      `[MATERIAL DA TOOL ATIVA — VÍDEO GUIADO]`,
      `Título do vídeo: ${v.title}${v.channel ? ` (Canal: ${v.channel})` : ""}`,
      `Trecho focado: ${v.watchStartSeconds}s até ${v.watchEndSeconds}s`,
      v.transcriptSummary ? `Resumo da transcrição: ${v.transcriptSummary}` : "",
      keyMomentsText ? `Momentos-chave: ${keyMomentsText}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (step.toolRef === "concept_explainer" && content.tools.concept_explainer) {
    const c = content.tools.concept_explainer;
    return [
      `[MATERIAL DA TOOL ATIVA — GUIA DO MENTOR (CONCEPT EXPLAINER)]`,
      `Título: ${c.title}`,
      `Conteúdo em Markdown:\n${c.markdown.slice(0, 8000)}`,
    ].join("\n");
  }

  if (step.toolRef === "active_recall_quiz" && content.tools.active_recall_quiz) {
    const q = content.tools.active_recall_quiz;
    const isConfirmed = quizState?.phase === "confirmed";

    const formattedQuestions = q.questions
      .map((item, idx) => {
        const isCurrent =
          quizState?.activeQuestionId === item.id ||
          (!quizState?.activeQuestionId && idx === 0);
        const optionsText = item.options
          .map((opt) => `  - (${opt.id}) ${opt.text}`)
          .join("\n");

        const base = [
          `Questão ${idx + 1}${isCurrent ? " [QUESTÃO ATUAL NA TELA]" : ""} (id: ${item.id}): ${item.question}`,
          `Alternativas:\n${optionsText}`,
        ];

        // Guarda Socrática: só libera o gabarito se o aluno já confirmou a resposta
        if (isConfirmed && isCurrent) {
          base.push(`Alternativa marcada pelo aluno: ${quizState?.selectedOptionId ?? "N/A"}`);
          base.push(`Gabarito oficial: ${item.correctOptionId}`);
          base.push(`Explicação oficial: ${item.explanation}`);
        } else {
          base.push(
            `[GUARDA SOCRÁTICA ATIVA: O aluno ainda NÃO confirmou a resposta desta questão. NÃO revele qual alternativa é a correta; dê apenas dicas conceituais ou faça uma pergunta guiada.]`,
          );
        }

        return base.join("\n");
      })
      .join("\n\n");

    return [
      `[MATERIAL DA TOOL ATIVA — QUIZ DE FIXAÇÃO]`,
      `Fase atual do aluno no quiz: ${isConfirmed ? "confirmed (já respondeu)" : "answering (ainda tentando responder)"}`,
      formattedQuestions,
    ].join("\n\n");
  }

  return "";
}

function buildBeeSystemPrompt({
  firstName,
  knowledgeGraph,
  planGoal,
  completedTasks,
  totalTasks,
  taskOrder,
  taskTitle,
  whyItMatters,
  durationMinutes,
  content,
  currentStepId,
  checkedWalkthroughIndices,
  quizState,
}: {
  firstName: string;
  knowledgeGraph: string | null;
  planGoal: string;
  completedTasks: number;
  totalTasks: number;
  taskOrder: number;
  taskTitle: string;
  whyItMatters: string;
  durationMinutes: number;
  content: TaskContent;
  currentStepId: string;
  checkedWalkthroughIndices: number[];
  quizState?: {
    activeQuestionId?: string;
    phase: "answering" | "confirmed";
    selectedOptionId?: string | null;
  };
}): string {
  const step = content.steps.find((s) => s.id === currentStepId) ?? content.steps[0];
  const checkedSet = new Set(checkedWalkthroughIndices);

  const stepsOverview = content.steps
    .map(
      (s) =>
        `- Passo ${s.order}: "${s.title}" (${s.phase}, tool: ${s.toolRef})${
          s.id === step?.id ? " <-- [PASSO ATUAL]" : ""
        }`,
    )
    .join("\n");

  const walkthroughLines = (step?.walkthrough ?? [])
    .map((item, idx) => `  ${checkedSet.has(idx) ? "[x]" : "[ ]"} ${idx + 1}. ${item}`)
    .join("\n");

  const activeToolBlock = buildActiveToolContext(content, currentStepId, quizState);

  return `Você é a **Bee** (Bee Helper), a abelhinha mentora do Glint que acompanha o aluno em tempo real durante a sessão de estudo.

[PERSONALIDADE E TOM DE VOZ]
- Simpática, acolhedora, parceira e direta ao ponto.
- O nome do aluno é **${firstName}**. Use o nome de forma natural quando fizer sentido, sem repetir em toda frase.
- Respostas enxutas e escaneáveis (1 a 3 parágrafos curtos ou bullets práticos). O aluno está lendo você em uma coluna lateral estreita ao lado da aula.
- Se mostrar código ou comando de terminal, entregue o bloco limpo e explique em 1–2 linhas o que ele faz.
- Zero clichês robóticos, zero pontos de exclamação exagerados e zero enrolação.
- Responda sempre em Português do Brasil (pt-BR).

[REGRA PEDAGÓGICA — GUARDA SOCRÁTICA NO QUIZ]
- Se o passo atual for \`active_recall_quiz\` e o aluno estiver na fase \`answering\` (ainda não confirmou a alternativa), é ESTRITAMENTE PROIBIDO entregar a resposta certa ou dizer diretamente qual letra/opção marcar. Explique o conceito por trás da pergunta, elimine uma confusão comum ou faça uma pergunta guiada para o próprio ${firstName} chegar à resposta.

[QUANDO USAR A TOOL \`web_search\`]
- Você possui a ferramenta \`web_search\` (Firecrawl v2).
- Use \`web_search\` APENAS quando a dúvida do aluno exigir informações que não estão no material do passo atual (ex.: documentação oficial externa, erro específico de versão/terminal, sintaxe atualizada de biblioteca ou exemplo complementar do mundo real).
- Para dúvidas que já estão explicadas no material do passo abaixo, responda imediatamente sem chamar \`web_search\`.

[CONTEXTO NÍVEL 1 — ALUNO E PLANO]
- Aluno: ${firstName}
- Perfil de aprendizado (Knowledge Graph): ${(knowledgeGraph ?? "Não informado").slice(0, 1800)}
- Objetivo do Plano: ${planGoal}
- Progresso no Plano: ${completedTasks} de ${totalTasks} sessões concluídas

[CONTEXTO NÍVEL 2 — SESSÃO DE HOJE (TASK #${taskOrder})]
- Título da Sessão: ${taskTitle}
- Por que importa: ${whyItMatters}
- Duração prevista: ${durationMinutes} min
- Estrutura da Sessão:
${stepsOverview}

[CONTEXTO NÍVEL 3 — PASSO ATUAL NA TELA]
- Passo ${step?.order ?? 1}: ${step?.title ?? ""}
- Fase: ${step?.phase ?? ""} | Ferramenta: ${step?.toolRef ?? ""}
- Objetivo do passo: ${step?.objective ?? ""}
- Entregável esperado ao concluir: ${step?.deliverable ?? ""}
- Roteiro passo a passo (itens marcados com [x] já foram feitos pelo aluno):
${walkthroughLines}

${activeToolBlock}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ planId: string; taskId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { planId, taskId } = await context.params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const parsedBody = BeeRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return Response.json(
      { error: "Payload inválido.", details: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  const { messages, liveStepContext } = parsedBody.data;

  const planTask = await prisma.planTask.findFirst({
    where: {
      planId,
      plan: { userId: user.id },
      OR: [{ id: taskId }, { taskKey: taskId }],
    },
    include: {
      plan: {
        select: {
          refinedGoal: true,
          rawInput: true,
          completedTasks: true,
          totalTasks: true,
          user: {
            select: {
              name: true,
              knowledgeGraph: true,
            },
          },
        },
      },
    },
  });

  if (!planTask) {
    return Response.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  const taskContent = parseTaskContent(planTask.content);
  if (!taskContent) {
    return Response.json(
      { error: "O conteúdo desta sessão ainda não foi gerado." },
      { status: 422 },
    );
  }

  const systemPrompt = buildBeeSystemPrompt({
    firstName: getFirstName(planTask.plan.user.name ?? user.name),
    knowledgeGraph: planTask.plan.user.knowledgeGraph,
    planGoal: planTask.plan.refinedGoal ?? planTask.plan.rawInput,
    completedTasks: planTask.plan.completedTasks,
    totalTasks: planTask.plan.totalTasks,
    taskOrder: planTask.order,
    taskTitle: planTask.title,
    whyItMatters: planTask.whyItMatters,
    durationMinutes: planTask.durationMinutes,
    content: taskContent,
    currentStepId: liveStepContext.currentStepId,
    checkedWalkthroughIndices: liveStepContext.checkedWalkthroughIndices,
    quizState: liveStepContext.quizState,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const sendEvent = (event: BeeStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      const collectedSources = new Map<string, BeeSourceItem>();

      try {
        const result = streamText({
          model: models.lowCost,
          system: systemPrompt,
          messages,
          stopWhen: stepCountIs(3),
          tools: {
            web_search: tool({
              description:
                "Pesquisa documentação oficial, referências técnicas ou exemplos atualizados na web quando a resposta não estiver no material do passo atual.",
              inputSchema: z.object({
                query: z
                  .string()
                  .min(3)
                  .max(160)
                  .describe("Consulta objetiva de busca técnica na web."),
              }),
              execute: async ({ query }) => {
                sendEvent({ type: "status", status: "searching" });
                const docs = await searchWebWithFirecrawlV2(query, {
                  limit: 3,
                  timeoutMs: 12000,
                  maxCharsPerDoc: 2500,
                });

                for (const doc of docs) {
                  if (!collectedSources.has(doc.url)) {
                    collectedSources.set(doc.url, {
                      title: doc.title,
                      url: doc.url,
                    });
                  }
                }

                if (collectedSources.size > 0) {
                  sendEvent({
                    type: "sources",
                    sources: Array.from(collectedSources.values()),
                  });
                }

                return {
                  results: docs.map((d) => ({
                    title: d.title,
                    url: d.url,
                    snippet: d.markdown,
                  })),
                };
              },
            }),
          },
        });

        for await (const part of result.fullStream) {
          if (part.type === "text-delta" && part.text) {
            sendEvent({ type: "text-delta", text: part.text });
          } else if (part.type === "error") {
            console.error("[bee-route] Erro no stream:", part.error);
            sendEvent({
              type: "error",
              message:
                "Não consegui responder agora. Tente novamente em instantes.",
            });
          }
        }
      } catch (err) {
        console.error("[bee-route] Falha ao processar resposta da Bee:", err);
        sendEvent({
          type: "error",
          message: "Não consegui responder agora. Tente novamente em instantes.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
