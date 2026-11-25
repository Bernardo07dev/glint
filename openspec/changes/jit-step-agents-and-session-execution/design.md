# Design: `jit-step-agents-and-session-execution`

## Context

O banco de dados possui a tabela relacional `PlanTask` (`prisma/schema.prisma`) e os schemas Zod de contrato front-end em `lib/task-content.ts` (`TaskContentSchema`, `VideoToolSchema`, `ConceptExplainerSchema`, `RecallQuizSchema`, `SessionStepSchema`). O objetivo desta mudança é implementar os motores de IA que preenchem `PlanTask.stepsPlan` e `PlanTask.content` Just-In-Time, a camada de agendamento/execução atômica e a página onde o aluno executa a sessão.

## Goals / Non-Goals

**Goals:**
- Garantir a regra `Tool → Walkthrough`: resolver e validar os insumos reais das tools antes de gerar o roteiro passo a passo (`walkthrough`) e o quiz.
- Manter os agentes em `lib/step-agents/` como funções puras de domínio (sem dependência de Prisma), centralizando persistência e lock atômico em `lib/enrich-plan-task.ts`.
- Permitir tanto execução agendada via Trigger.dev (`T-10 min`) quanto geração direta sob demanda via Server Action (`enrichTaskNowAction`) para planos FREE e PRO.

**Non-Goals:**
- Implementar a tool `guided_lab` (removida do escopo atual em favor das 3 tools oficiais: `video`, `concept_explainer` e `active_recall_quiz`).
- Persistir no banco o estado intermediário dos checkboxes do widget lateral de Roteiro ou das tentativas individuais do quiz na v1 (mantidos em estado local da sessão).

## Decisions

### 1. Agentes de Domínio Puros (`lib/step-agents/`) vs. Persistência Centralizada (`lib/enrich-plan-task.ts`)
Os módulos em `lib/step-agents/` recebem apenas `StepAgentTaskContext` e retornam objetos validados por Zod. Toda leitura e escrita no Prisma (`PlanTask` e espelhamento em `LearningPlan.planStructure`) ocorre em `enrichPlanTaskDirect` (`lib/enrich-plan-task.ts`), que é compartilhada pelo worker `trigger/enrich-plan-task.ts` e pela Server Action `enrichTaskNowAction`.

### 2. Schemas Zod Planos para `Output.object` vs. Validação Final com `.refine()`
Providers de Structured Output estrito via OpenRouter rejeitam schemas contendo `.refine()`, `.superRefine()` ou propriedades opcionais sem default. Por isso, cada step agent utiliza um schema Zod plano na chamada `generateText` + `Output.object`, normaliza limites em código (ex.: clamp matemático de timestamps e verificação de `correctOptionId`) e executa `VideoToolSchema.parse`, `ConceptExplainerSchema.parse`, `RecallQuizSchema.parse` e `TaskContentSchema.parse` de `lib/task-content.ts` na saída final.

### 3. Motor `video` (`lib/step-agents/video-agent.ts`): YouTube Data API v3 + Supadata (`ms → s`)
1. **Query Planner (`models.fast`):** gera 3 queries complementares para o YouTube.
2. **Busca e Hard Filter (301 unidades de cota):** 3 chamadas `search.list` em paralelo + deduplicação + 1 chamada `videos.list` (`part=snippet,contentDetails,statistics,status`). Descarta em código vídeos com `status.embeddable !== true`, `liveBroadcastContent !== "none"` ou duração fora de `[120s, 5400s]`. Ranqueia os aprovados deterministicamente (presença de capítulos, razão `likes/views`, match lexical e idioma).
3. **Transcrição via Supadata (`GET /v1/youtube/transcript`):** autenticada via header `x-api-key`. Como a Supadata retorna `offset` e `duration` em **milissegundos (`ms`)**, o agente converte cada segmento para segundos (`Math.floor(offset / 1000)`) antes de agrupar em janelas de ~30s.
4. **Segment Slicer + Jev Judge:** recorta `watchStartSeconds` e `watchEndSeconds` respeitando `estimatedMinutes * 60`, extrai 2 a 4 `keyMoments` dentro do recorte e valida o alinhamento pedagógico via `checkWithJev`.

### 4. Motor `concept_explainer` (`lib/step-agents/concept-explainer-agent.ts`): Firecrawl v2 + Síntese Editorial
1. **Pesquisa Web (`POST https://api.firecrawl.dev/v2/search`):** envia `query`, `sources: [{ type: "web" }]`, `limit: 3` e `scrapeOptions: { formats: ["markdown"], onlyMainContent: true }`. Em caso de retorno vazio ou timeout, aplica fallback gracioso sem abortar a sessão.
2. **Síntese Editorial (`models.architect`):** gera guia em Markdown calibrado para `RichMarkdown` e `MermaidBlock` (rótulos Mermaid sempre entre aspas duplas, tabelas comparativas GFM e blocos de código com linguagem explícita).
3. **Fontes Verificadas:** filtra `usedSourceUrls` exclusivamente contra as URLs reais retornadas pelo Firecrawl v2, impedindo URLs alucinadas em `sources`.

### 5. Lock Atômico Anti-Duplicidade (`PENDING`/`FAILED` → `GENERATING`)
Antes de invocar qualquer LLM ou API externa, `enrichPlanTaskDirect` executa `prisma.planTask.updateMany` condicionando `enrichmentStatus: { in: ["PENDING", "FAILED"] }` para `"GENERATING"`. Se `lock.count === 0`, a execução retorna `{ skipped: true }` imediatamente, evitando gasto duplicado entre o disparo agendado (`T-10 min`) e o disparo On-Demand na tela da sessão.

## Risks / Trade-offs

- **Cota diária da YouTube Data API v3 (10.000 unidades/dia no tier padrão):** cada sessão com tool `video` consome 301 unidades (~33 sessões/dia). Mitigação: executar `videos.list` em lote único (1 unidade) e solicitar expansão gratuita de cota no Google Cloud Console conforme o volume crescer.
- **Indisponibilidade temporária de resultados no Firecrawl Search:** mitigada pelo fallback gracioso em `concept-explainer-agent.ts`, que sintetiza o guia técnico com `sources` vazio em vez de marcar a task como `FAILED`.
