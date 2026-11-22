# Design: `jit-task-video-engine`

## Context

O schema de `PlanTask` já foi criado e aplicado em `prisma/schema.prisma`. O próximo passo é conectar a geração do esqueleto (`generating-tasks.ts`) à tabela `PlanTask` e construir o pipeline Just-In-Time (JIT) começando pela tool `video` (YouTube).

## Decisions

### 1. Identificadores Agnósticos das 4 Tools Principais
Em `lib/agents/types.ts`, `RequiredToolSchema` passa a usar os 4 identificadores oficiais:
- `video` (Fase 1: YouTube via `youtube-nocookie.com`; futuro: R2/Mux/CC)
- `concept_explainer`
- `guided_lab`
- `active_recall_quiz`

### 2. Estrutura de `PlanTask.content` (`Tool → Walkthrough`)
```ts
{
  tools: {
    video?: {
      provider: "youtube";
      videoId: string;
      title: string;
      channel: string;
      durationSeconds: number;
      watchStartSeconds: number;
      watchEndSeconds: number;
      transcriptSummary: string;
      keyMoments: Array<{ timestampSeconds: number; label: string }>;
    };
    // ...futuras tools
  };
  steps: Array<{
    id: string;
    order: number;
    phase: "consume" | "practice";
    estimatedMinutes: number;
    toolRef: "video" | "concept_explainer" | "guided_lab" | "active_recall_quiz";
    title: string;
    objective: string;
    walkthrough: string[];
    deliverable: string;
  }>;
}
```

### 3. Pipeline do Motor `video` (YouTube)
1. **Query Planner (`models.fast`):** Gera 2–3 queries (PT-BR + EN técnico) a partir de `title`, `whyItMatters` e `searchQueryUsed`.
2. **Busca & Hard Filter:** Busca top 8 vídeos (InnerTube / `youtube-sr` ou API v3), descarta `durationSeconds < 120`, `durationSeconds > 5400` e `embeddable === false`.
3. **Transcrição em Blocos de 30s:** Extrai `timedtext` dos top 3 candidatos e agrupa em blocos de 30 segundos (`[MM:SS - MM:SS] texto`) para reduzir ~80% dos tokens enviados ao LLM.
4. **Segment Slicer + Jev Judge:** `models.fast` escolhe o melhor candidato, recorta `watchStartSeconds` e `watchEndSeconds` (`<= consumeMinutes * 60`) e extrai `keyMoments`. `checkWithJev` valida se o trecho cobre o objetivo da task.
5. **Walkthrough Synthesizer:** Com `tools.video` resolvido, o agente gera os `steps` citando os timestamps reais do trecho recortado.

## Risks / Trade-offs
- **Rate limit / bloqueio de InnerTube em serverless:** Se o YouTube bloquear chamadas de IP de datacenter, teremos interface `VideoSearchProvider` desacoplada para trocar facilmente para YouTube Data API v3 ou Serper/Exa sem alterar o restante do pipeline.
