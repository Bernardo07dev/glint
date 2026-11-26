import { generateText, Output } from "ai";
import { z } from "zod";
import { BASE_SYSTEM_PROMPT } from "@/lib/agents/prompts";
import { checkWithJev, models } from "@/lib/infra/llm";
import { VideoToolSchema, type VideoToolData } from "@/lib/tasks/task-content";
import {
  formatLearnerProfileSummary,
  type StepAgentTaskContext,
  type StepBlueprintItem,
} from "./types";

const VideoQueriesSchema = z.object({
  queries: z.array(z.string().min(2)).min(1).max(3),
});

const VideoSliceOutputSchema = z.object({
  watchStartSeconds: z.number().int().nonnegative(),
  watchEndSeconds: z.number().int().positive(),
  transcriptSummary: z.string().min(1),
  keyMoments: z
    .array(
      z.object({
        timestampSeconds: z.number().int().nonnegative(),
        label: z.string().min(1),
      }),
    )
    .min(2)
    .max(4),
});

interface YouTubeCandidate {
  videoId: string;
  title: string;
  channel: string;
  description: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  defaultLanguage: string;
  score: number;
}

interface SupadataChunk {
  text?: string;
  offset?: number;
  duration?: number;
}

function parseIsoDurationSeconds(iso: string | undefined): number {
  if (!iso) return 0;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

function scoreCandidate(
  candidate: Omit<YouTubeCandidate, "score">,
  targetKeywords: Set<string>,
  preferredLanguage: string,
): number {
  let score = 0;

  if (/\b\d{1,2}:\d{2}\b/.test(candidate.description)) {
    score += 25;
  }

  if (candidate.durationSeconds >= 240 && candidate.durationSeconds <= 2400) {
    score += 10;
  }

  const ratio = candidate.likeCount / Math.max(1, candidate.viewCount);
  score += Math.min(15, Math.round(ratio * 400));

  const titleTokens = tokenize(`${candidate.title} ${candidate.description.slice(0, 300)}`);
  let matches = 0;
  for (const token of titleTokens) {
    if (targetKeywords.has(token)) matches++;
  }
  score += Math.min(20, matches * 4);

  if (
    preferredLanguage &&
    candidate.defaultLanguage.toLowerCase().startsWith(preferredLanguage.toLowerCase())
  ) {
    score += 8;
  }

  return score;
}

async function generateYouTubeQueries(
  context: StepAgentTaskContext,
  step: StepBlueprintItem,
): Promise<string[]> {
  const learnerProfile = formatLearnerProfileSummary(context.executableMeta);
  const preferredLanguage = context.preferredLanguage ?? "pt";

  const { output } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: VideoQueriesSchema,
      name: "YouTubeSearchQueries",
      description: "3 queries complementares otimizadas para busca no YouTube.",
    }),
    system: `${BASE_SYSTEM_PROMPT}

Você é o Query Planner do motor de vídeos do Glint.
Gere exatamente 3 queries curtas e objetivas para encontrar os tutoriais ou explicações mais didáticos no YouTube sobre o objetivo do step.
Regras:
- Idioma preferencial do aluno: ${preferredLanguage} (use termos técnicos em inglês quando o ecossistema exigir, ex.: React, CLI, Docker).
- Cubra ângulos complementares (ex.: tutorial passo a passo, explicação conceitual, demonstração prática).
- Evite palavras vagas como "completo 10 horas" ou clickbait.`,
    prompt: `Objetivo do plano: "${context.refinedGoal}"
Sessão: "${context.title}"
Objetivo específico do vídeo: "${step.goal}"
Query base: "${context.searchQueryUsed}"
Tempo disponível para o vídeo: ${step.estimatedMinutes} min

Perfil do aluno:
${learnerProfile}`,
  });

  const unique = Array.from(
    new Set(output.queries.map((q) => q.trim()).filter((q) => q.length >= 2)),
  );
  return unique.length > 0 ? unique.slice(0, 3) : [context.searchQueryUsed || step.goal];
}

async function fetchYouTubeCandidates(
  queries: string[],
  context: StepAgentTaskContext,
  step: StepBlueprintItem,
  apiKey: string,
): Promise<YouTubeCandidate[]> {
  const searchResponses = await Promise.all(
    queries.map(async (q) => {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("type", "video");
      url.searchParams.set("videoEmbeddable", "true");
      url.searchParams.set("maxResults", "6");
      url.searchParams.set("q", q);
      url.searchParams.set("key", apiKey);

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`YouTube search.list falhou (${res.status}): ${text.slice(0, 200)}`);
      }
      const data = (await res.json()) as {
        items?: Array<{ id?: { videoId?: string } }>;
      };
      return (data.items ?? [])
        .map((item) => item.id?.videoId)
        .filter((id): id is string => Boolean(id));
    }),
  );

  const uniqueIds = Array.from(new Set(searchResponses.flat())).slice(0, 25);
  if (uniqueIds.length === 0) {
    throw new Error("Nenhum vídeo encontrado na busca do YouTube para este step.");
  }

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "snippet,contentDetails,statistics,status");
  videosUrl.searchParams.set("id", uniqueIds.join(","));
  videosUrl.searchParams.set("key", apiKey);

  const videosRes = await fetch(videosUrl.toString(), {
    signal: AbortSignal.timeout(15000),
  });
  if (!videosRes.ok) {
    const text = await videosRes.text();
    throw new Error(`YouTube videos.list falhou (${videosRes.status}): ${text.slice(0, 200)}`);
  }

  const videosJson = (await videosRes.json()) as {
    items?: Array<{
      id?: string;
      snippet?: {
        title?: string;
        channelTitle?: string;
        description?: string;
        liveBroadcastContent?: string;
        defaultAudioLanguage?: string;
        defaultLanguage?: string;
      };
      contentDetails?: { duration?: string };
      statistics?: { viewCount?: string; likeCount?: string };
      status?: { embeddable?: boolean };
    }>;
  };

  const targetKeywords = new Set(
    tokenize(`${step.goal} ${context.title} ${context.searchQueryUsed}`),
  );
  const preferredLang = context.preferredLanguage ?? "pt";

  const approved: YouTubeCandidate[] = [];
  for (const item of videosJson.items ?? []) {
    if (!item.id || !item.snippet?.title) continue;
    if (item.status?.embeddable !== true) continue;
    if (item.snippet.liveBroadcastContent !== "none") continue;

    const durationSeconds = parseIsoDurationSeconds(item.contentDetails?.duration);
    if (durationSeconds < 120 || durationSeconds > 5400) continue;

    const base = {
      videoId: item.id,
      title: item.snippet.title,
      channel: item.snippet.channelTitle ?? "",
      description: item.snippet.description ?? "",
      durationSeconds,
      viewCount: Number(item.statistics?.viewCount ?? 0),
      likeCount: Number(item.statistics?.likeCount ?? 0),
      defaultLanguage:
        item.snippet.defaultAudioLanguage ?? item.snippet.defaultLanguage ?? "",
    };

    approved.push({
      ...base,
      score: scoreCandidate(base, targetKeywords, preferredLang),
    });
  }

  approved.sort((a, b) => b.score - a.score);
  return approved.slice(0, 3);
}

/**
 * Fetches transcript from Supadata and converts `offset` & `duration` from
 * milliseconds (`ms`) to seconds (`s`) before condensing into ~30s blocks.
 */
async function fetchCondensedTranscript(
  videoId: string,
  supadataKey: string,
): Promise<string | null> {
  try {
    const url = `https://api.supadata.ai/v1/youtube/transcript?videoId=${encodeURIComponent(videoId)}`;
    const res = await fetch(url, {
      headers: { "x-api-key": supadataKey },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { content?: SupadataChunk[] };
    const chunks = Array.isArray(json.content) ? json.content : [];
    if (chunks.length === 0) return null;

    const blocks: string[] = [];
    let bucketStartSec = Math.floor((chunks[0].offset ?? 0) / 1000);
    let bucketEndSec = bucketStartSec;
    let bucketTexts: string[] = [];

    const flushBucket = () => {
      const joined = bucketTexts.join(" ").replace(/\s+/g, " ").trim();
      if (joined) {
        blocks.push(
          `[${formatMmSs(bucketStartSec)} - ${formatMmSs(bucketEndSec)}] (start=${bucketStartSec}s) ${joined}`,
        );
      }
      bucketTexts = [];
    };

    for (const chunk of chunks) {
      const text = chunk.text?.trim();
      if (!text) continue;
      const startSec = Math.floor((chunk.offset ?? 0) / 1000);
      const durSec = Math.max(1, Math.floor((chunk.duration ?? 0) / 1000));

      if (startSec - bucketStartSec >= 30 && bucketTexts.length > 0) {
        flushBucket();
        bucketStartSec = startSec;
      }

      bucketEndSec = Math.max(bucketStartSec + 1, startSec + durSec);
      bucketTexts.push(text);
    }
    flushBucket();

    const fullText = blocks.join("\n");
    return fullText.length > 0 ? fullText.slice(0, 14000) : null;
  } catch {
    return null;
  }
}

async function sliceAndValidateCandidate(
  candidate: YouTubeCandidate,
  transcriptText: string,
  usedFallbackDescription: boolean,
  context: StepAgentTaskContext,
  step: StepBlueprintItem,
): Promise<{ video: VideoToolData; approved: boolean }> {
  const maxClipSeconds = Math.max(
    120,
    Math.min(step.estimatedMinutes * 60, candidate.durationSeconds),
  );

  const { output } = await generateText({
    model: models.fast,
    output: Output.object({
      schema: VideoSliceOutputSchema,
      name: "VideoSegmentSlice",
      description:
        "Recorte exato do vídeo (watchStartSeconds, watchEndSeconds), resumo e keyMoments.",
    }),
    system: `${BASE_SYSTEM_PROMPT}

Você é o Segment Slicer do Glint.
Analise a transcrição com timestamps (e/ou capítulos) do vídeo e recorte o trecho contínuo mais didático para ensinar o objetivo do step.

Regras obrigatórias:
1. watchStartSeconds e watchEndSeconds devem ser inteiros em SEGUNDOS dentro de [0, ${candidate.durationSeconds}].
2. Pule introduções genéricas, jabás ou despedidas.
3. A duração do recorte (watchEndSeconds - watchStartSeconds) deve ser NO MÁXIMO ${maxClipSeconds} segundos (orçamento de ${step.estimatedMinutes} min) e pelo menos 60 segundos.
4. Extraia de 2 a 4 keyMoments reais dentro do intervalo [watchStartSeconds, watchEndSeconds].
5. Escreva transcriptSummary objetivo em português brasileiro explicando o que é ensinado exatamente nesse recorte.`,
    prompt: `Objetivo do step: "${step.goal}"
Sessão: "${context.title}"
Vídeo candidato: "${candidate.title}" (canal: ${candidate.channel}, duração total: ${candidate.durationSeconds}s)

Descrição / Capítulos do vídeo:
${candidate.description.slice(0, 2000)}

${usedFallbackDescription ? "Observação: transcrição automática indisponível; use os capítulos e descrição acima." : "Transcrição com timestamps (em segundos):"}
${transcriptText}`,
  });

  // Deterministic bounds clamp so VideoToolPlayer & VideoToolSchema never fail.
  const duration = candidate.durationSeconds;
  const minSlice = Math.min(60, Math.max(10, duration - 1));
  const clampedStart = Math.max(
    0,
    Math.min(Math.floor(output.watchStartSeconds), Math.max(0, duration - minSlice)),
  );
  let clampedEnd = Math.min(
    duration,
    Math.max(clampedStart + minSlice, Math.floor(output.watchEndSeconds)),
  );
  if (clampedEnd - clampedStart > maxClipSeconds) {
    clampedEnd = Math.min(duration, clampedStart + maxClipSeconds);
  }
  if (clampedEnd <= clampedStart) {
    clampedEnd = Math.min(duration, clampedStart + minSlice);
  }

  const seenTimestamps = new Set<number>();
  const keyMoments = output.keyMoments
    .map((km) => ({
      timestampSeconds: Math.max(
        clampedStart,
        Math.min(clampedEnd, Math.floor(km.timestampSeconds)),
      ),
      label: km.label.trim(),
    }))
    .sort((a, b) => a.timestampSeconds - b.timestampSeconds)
    .filter((km) => {
      if (!km.label || seenTimestamps.has(km.timestampSeconds)) return false;
      seenTimestamps.add(km.timestampSeconds);
      return true;
    });

  const validated = VideoToolSchema.parse({
    provider: "youtube",
    videoId: candidate.videoId,
    title: candidate.title,
    channel: candidate.channel || undefined,
    durationSeconds: candidate.durationSeconds,
    watchStartSeconds: clampedStart,
    watchEndSeconds: clampedEnd,
    transcriptSummary: output.transcriptSummary.trim(),
    keyMoments: keyMoments.length > 0 ? keyMoments : undefined,
  });

  const jev = await checkWithJev({
    state: `Objetivo do step: ${step.goal}\nTítulo do vídeo: ${validated.title}\nResumo do trecho (${formatMmSs(validated.watchStartSeconds)}–${formatMmSs(validated.watchEndSeconds)}): ${validated.transcriptSummary ?? ""}\nMomentos-chave: ${(validated.keyMoments ?? []).map((k) => k.label).join("; ")}`,
    instructions:
      "Avalie se o trecho de vídeo selecionado ensina de forma direta e útil o objetivo deste step de estudo.",
    threshold: 0.65,
  });

  return { video: validated, approved: jev.approved };
}

/**
 * Tool 1 (`video`): searches YouTube Data API v3, hard-filters embeddable videos,
 * extracts timestamped transcripts via Supadata (ms -> s), slices within budget,
 * and validates alignment with `checkWithJev`.
 */
export async function runVideoStepAgent({
  context,
  step,
}: {
  context: StepAgentTaskContext;
  step: StepBlueprintItem;
}): Promise<VideoToolData> {
  const youtubeKey = process.env.YOUTUBE_API_KEY;
  const supadataKey = process.env.SUPADATA_API_KEY;

  if (!youtubeKey) {
    throw new Error("YOUTUBE_API_KEY não configurada no ambiente.");
  }
  if (!supadataKey) {
    throw new Error("SUPADATA_API_KEY não configurada no ambiente.");
  }

  const queries = await generateYouTubeQueries(context, step);
  const candidates = await fetchYouTubeCandidates(queries, context, step, youtubeKey);

  if (candidates.length === 0) {
    throw new Error("Nenhum vídeo embeddable entre 2m e 90m passou nos filtros do YouTube.");
  }

  const withTranscripts: Array<{ candidate: YouTubeCandidate; transcript: string }> = [];
  for (const candidate of candidates) {
    const transcript = await fetchCondensedTranscript(candidate.videoId, supadataKey);
    if (transcript) {
      withTranscripts.push({ candidate, transcript });
      if (withTranscripts.length >= 2) break;
    }
  }

  if (withTranscripts.length === 0) {
    const fallbackCandidate = candidates[0];
    const fallbackText =
      fallbackCandidate.description.trim().slice(0, 4000) || fallbackCandidate.title;
    const { video } = await sliceAndValidateCandidate(
      fallbackCandidate,
      fallbackText,
      true,
      context,
      step,
    );
    return video;
  }

  const firstAttempt = await sliceAndValidateCandidate(
    withTranscripts[0].candidate,
    withTranscripts[0].transcript,
    false,
    context,
    step,
  );
  if (firstAttempt.approved || withTranscripts.length === 1) {
    return firstAttempt.video;
  }

  const secondAttempt = await sliceAndValidateCandidate(
    withTranscripts[1].candidate,
    withTranscripts[1].transcript,
    false,
    context,
    step,
  );
  return secondAttempt.approved ? secondAttempt.video : firstAttempt.video;
}
