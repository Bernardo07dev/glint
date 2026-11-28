import { generateText, Output } from "ai";
import { z } from "zod";
import { models } from "@/lib/infra/llm";
import { prisma } from "@/lib/infra/prisma";

export const ANIMATION_COLUMNS = [
  "firstAccess",
  "waitingFrontTap",
  "homeSplashReady",
  "homeSplashStreak",
  "homeSplashReturn",
  "homeSplashRest",
  "planCreation",
  "plansHub",
] as const;

export type AnimationColumn = (typeof ANIMATION_COLUMNS)[number];

export type UserAnimationPhrasesMap = Partial<Record<AnimationColumn, string | null>>;

function getFirstName(userName?: string | null): string {
  const cleaned = userName?.trim();
  if (!cleaned) return "por aqui";
  return cleaned.split(/\s+/)[0] || "por aqui";
}

export function buildFirstAccessHeadline(userName?: string | null): string {
  const cleaned = userName?.trim();
  if (!cleaned) {
    return "Bem vindooo! Que bom te ter aqui.";
  }
  const firstName = cleaned.split(/\s+/)[0];
  return `Bem vindooo! Que bom te ter aqui ${firstName}`;
}

export function getFallbackAnimationHeadline(
  column: AnimationColumn,
  userName?: string | null,
): string {
  const cleaned = userName?.trim();
  const firstName = cleaned ? cleaned.split(/\s+/)[0] : null;
  const vocative = firstName ? `, ${firstName}` : "";

  switch (column) {
    case "firstAccess":
      return buildFirstAccessHeadline(userName);
    case "waitingFrontTap":
      return `Calma aí${vocative}... tô montando o vídeo, guia e quiz dessa aula. Se quiser voltar, eu continuo por aqui!`;
    case "homeSplashReady":
      return `Sua sessão de hoje já está pronta${vocative}. Vamos direto ao próximo passo!`;
    case "homeSplashStreak":
      return `Ritmo impecável nesta semana${vocative}! Vamos manter a constância em alta.`;
    case "homeSplashReturn":
      return `Que bom te ver de volta${vocative}. Sua trilha já está ajustada para retomarmos sem pressa.`;
    case "homeSplashRest":
      return `Missão de hoje cumprida${vocative}. Agora é hora de fechar o caderno e descansar a mente.`;
    case "planCreation":
      return `Conectando seus objetivos e horários${vocative} para montar um plano que cabe na sua rotina...`;
    case "plansHub":
      return `Sua rota de estudos está organizada e pronta para os próximos marcos${vocative}!`;
  }
}

export async function getUserAnimationPhrase(
  userId: string,
  column: AnimationColumn,
  userName?: string | null,
): Promise<string> {
  if (column === "firstAccess") {
    const row = await prisma.userAnimation.findUnique({
      where: { userId },
      select: { firstAccess: true },
    });
    return row?.firstAccess?.trim() || buildFirstAccessHeadline(userName);
  }

  const row = await prisma.userAnimation.findUnique({
    where: { userId },
    select: { [column]: true } as Record<AnimationColumn, boolean>,
  });

  const value = row?.[column as keyof typeof row];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return getFallbackAnimationHeadline(column, userName);
}

export async function getUserAnimationPhrases(
  userId: string,
): Promise<UserAnimationPhrasesMap> {
  const row = await prisma.userAnimation.findUnique({
    where: { userId },
    select: {
      firstAccess: true,
      waitingFrontTap: true,
      homeSplashReady: true,
      homeSplashStreak: true,
      homeSplashReturn: true,
      homeSplashRest: true,
      planCreation: true,
      plansHub: true,
    },
  });

  return row ?? {};
}

export async function setUserAnimationPhrases(
  userId: string,
  updates: Partial<Record<AnimationColumn, string>>,
): Promise<void> {
  const cleanedEntries = Object.entries(updates).filter(
    ([, val]) => typeof val === "string" && val.trim().length > 0,
  );

  if (cleanedEntries.length === 0) return;

  const data = Object.fromEntries(
    cleanedEntries.map(([key, val]) => [key, (val as string).trim()]),
  );

  await prisma.userAnimation.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  });
}

const COLUMN_GUIDANCE: Record<Exclude<AnimationColumn, "firstAccess">, string> = {
  waitingFrontTap:
    "Carregamento da aula (vídeo, guia e quiz sob medida com polling): tranquilizadora, direta e bem-humorada, avisando o aluno que está preparando a sessão dele e que ele pode voltar para os planos enquanto carrega.",
  homeSplashReady:
    "Entrada diária com sessão pronta para hoje: convite energético e objetivo mencionando o tema do plano ativo ou a próxima aula e duração em minutos.",
  homeSplashStreak:
    "Ritmo forte / sequência cumprida na semana: celebração sincera sem exagero mencionando o ritmo atual e o tema que o aluno está dominando.",
  homeSplashReturn:
    "Retorno após dias sem estudar: acolhedora e sem culpa, avisando que a trilha foi ajustada para retomar do ponto certo.",
  homeSplashRest:
    "Dia concluído / horário livre: serena e elogiosa, convidando o aluno a descansar porque a missão de hoje já foi feita.",
  planCreation:
    "Durante a criação e entrevista do plano: investigativa e personalizada, comentando o objetivo ou rotina real que o aluno acabou de informar.",
  plansHub:
    "Visão geral da trilha / pós-replan / marco semanal: visão de progresso macro ou confirmação empática de que a rota foi recalculada mantendo a meta.",
};

export async function refreshUserAnimationPhrases(input: {
  userId: string;
  columns: AnimationColumn[];
  event: string;
  context?: string;
}): Promise<void> {
  try {
    const uniqueColumns = Array.from(new Set(input.columns));
    if (uniqueColumns.length === 0) return;

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        name: true,
        knowledgeGraph: true,
        lastActiveAt: true,
        learningPlans: {
          orderBy: { updatedAt: "desc" },
          take: 4,
          select: {
            stage: true,
            rawInput: true,
            refinedGoal: true,
            totalTasks: true,
            completedTasks: true,
            tasks: {
              where: { status: { in: ["AVAILABLE", "IN_PROGRESS", "LOCKED"] } },
              orderBy: { order: "asc" },
              take: 2,
              select: {
                title: true,
                durationMinutes: true,
                scheduledDate: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) return;

    const updates: Partial<Record<AnimationColumn, string>> = {};
    const llmColumns: Exclude<AnimationColumn, "firstAccess">[] = [];

    for (const col of uniqueColumns) {
      if (col === "firstAccess") {
        updates.firstAccess = buildFirstAccessHeadline(user.name);
      } else {
        llmColumns.push(col);
      }
    }

    if (llmColumns.length > 0) {
      const shape: Record<string, z.ZodString> = {};
      for (const col of llmColumns) {
        shape[col] = z.string().min(20).max(160);
      }
      const outputSchema = z.object(shape);

      const firstName = getFirstName(user.name);
      const planLines = user.learningPlans.map((p, idx) => {
        const nextTask = p.tasks[0];
        const nextTaskInfo = nextTask
          ? ` | próxima aula: "${nextTask.title}" (${nextTask.durationMinutes} min, ${nextTask.scheduledDate})`
          : "";
        return `- Plano ${idx + 1} [${p.stage}]: "${p.refinedGoal ?? p.rawInput}" (${p.completedTasks}/${p.totalTasks} aulas concluídas)${nextTaskInfo}`;
      });

      const guidanceLines = llmColumns.map(
        (col) => `- ${col}: ${COLUMN_GUIDANCE[col]}`,
      );

      const { output } = await generateText({
        model: models.lowCost,
        output: Output.object({
          schema: outputSchema,
          name: "UserAnimationPhrases",
          description:
            "Frases curtas personalizadas para os balões de fala da Abelhinha do Glint.",
        }),
        system: `Você escreve as frases dos balões de fala da Abelhinha do Glint (mentor pessoal de estudos).

Regras obrigatórias:
- Português brasileiro natural, caloroso e direto (zero robótico, zero clichê corporativo).
- Cada frase deve ter entre 55 e 135 caracteres (no máximo 2 linhas no balão de fala).
- Chame o aluno pelo primeiro nome ("${firstName}") de forma natural.
- Nunca use emojis, hashtags, marcadores ou aspas ao redor da frase.
- Use o contexto real do aluno (tema do plano, duração da aula, progresso, evento atual) sempre que disponível.`,
        prompt: [
          `Evento disparador: ${input.event}`,
          input.context ? `Contexto imediato: ${input.context}` : null,
          user.knowledgeGraph
            ? `Perfil do aluno (Knowledge Graph): ${user.knowledgeGraph}`
            : null,
          planLines.length > 0
            ? `Planos atuais:\n${planLines.join("\n")}`
            : "Aluno ainda não possui planos ativos.",
          `Gere uma frase sob medida para cada chave abaixo:\n${guidanceLines.join("\n")}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      });

      const record = output as Record<string, string>;
      for (const col of llmColumns) {
        const phrase = record[col]?.trim();
        if (phrase) {
          updates[col] = phrase;
        }
      }
    }

    await setUserAnimationPhrases(input.userId, updates);
  } catch (error) {
    console.error(
      `[animations/phrases] Falha ao atualizar frases (${input.event}):`,
      error,
    );
  }
}
