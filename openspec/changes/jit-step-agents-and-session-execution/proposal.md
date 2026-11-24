# Proposal: `jit-step-agents-and-session-execution`

## Why

As sessões de estudo (`PlanTask`) de um plano do Glint nascem apenas como esqueleto agendado durante `GENERATING_TASKS`. Enriquecer todas as sessões antecipadamente gerava desperdício de tokens caso o aluno mudasse de rotina, além de impedir a adaptação da aula seguinte ao desempenho real (`difficultyRating` e `userNotes`) da sessão anterior.

Além disso, para eliminar alucinação de URLs e instruções vagas, a geração Just-In-Time (JIT) precisa seguir a regra `Tool → Walkthrough`: primeiro resolver as 3 tools oficiais com insumos verificados (`video` via YouTube Data API v3 + transcrição Supadata, `concept_explainer` via Firecrawl v2 + síntese Markdown/Mermaid e `active_recall_quiz` dinâmico) e somente depois sintetizar os `steps` com `walkthrough` ancorado nos timestamps e seções reais, entregando a execução completa na rota `/planos/[planId]/tasks/[taskId]`.

## What Changes

- **Step Agents Modulares (`lib/step-agents/`):**
  - `lib/step-agents/types.ts`: contratos `StepAgentTaskContext`, `PreviousTaskFeedback`, `StepsPlanSchema` e formatadores de perfil/feedback.
  - `lib/step-agents/blueprint.ts`: `runBlueprintAgent` (`models.fast`) que gera `PlanTask.stepsPlan` garantindo 1 step único por `ToolId` na ordem pedagógica (`video` → `concept_explainer` → `active_recall_quiz`).
  - `lib/step-agents/video-agent.ts`: `runVideoStepAgent` integrando 3 buscas na YouTube Data API v3 (`search.list`) + filtro determinístico em lote (`videos.list`), extração de transcrição via Supadata convertendo `offset`/`duration` de milissegundos (`ms`) para segundos (`s`), recorte cirúrgico (`Segment Slicer`) e validação `checkWithJev`.
  - `lib/step-agents/concept-explainer-agent.ts`: `runConceptExplainerStepAgent` integrando Firecrawl v2 (`POST /v2/search` com `sources: [{ type: "web" }]` e `onlyMainContent: true`), fallback gracioso, síntese editorial em Markdown (`models.architect`) com diagramas Mermaid, tabelas GFM e validação determinística de `sources`.
  - `lib/step-agents/quiz-and-walkthrough-agent.ts`: `runQuizAndWalkthroughAgent` gerando de 2 a 5 questões dinâmicas de `active_recall_quiz`, sintetizando `walkthrough` e `deliverable` ancorados nos insumos reais, validando com `TaskContentSchema` e calculando `jevAlignmentScore`.
  - `lib/step-agents/index.ts`: barrel e orquestrador puro `runEnrichTaskPipeline` (executa `video` e `concept_explainer` em paralelo via `Promise.all`).
- **Executor Atômico e Orquestração Trigger.dev (`lib/enrich-plan-task.ts`, `trigger/enrich-plan-task.ts`, `lib/trigger-jobs.ts`):**
  - `enrichPlanTaskDirect` centraliza o lock atômico (`PENDING`/`FAILED` → `GENERATING` → `READY`/`FAILED`), a persistência incremental de `stepsPlan` e o espelhamento em `LearningPlan.planStructure`.
  - `schedulePlanTasksOnAccept`, `reschedulePlanTaskRuns` e `triggerTaskOnDemand` conectam `accept-plan.ts` e `lib/task-reschedule.ts` ao Trigger.dev v3 (`T-10 min`), além do workflow `.github/workflows/trigger-deploy.yml`.
- **Rota de Execução da Sessão e Server Actions (`app/(platform)/planos/[planId]/tasks/[taskId]/` & `app/actions/session.ts`):**
  - `page.tsx` (Server Component com `<Suspense>`) + `task-session-client.tsx` (Client Component com preparação sob demanda para FREE e PRO via `enrichTaskNowAction`, execução passo a passo via `SessionStep` + `StepStage`, persistência de steps via `recordStepProgressAction` e fechamento com feedback via `finishTaskSessionAction`).
  - Links atualizados em `plan-trail.tsx` ("Ir para sessão") e `next-task-hero.tsx` ("Preparar sessão" / "Começar sessão").

## Capabilities

### New Capabilities
- `jit-task-lifecycle`: Ciclo de vida Just-In-Time de `PlanTask`, lock atômico anti-duplicidade (`enrichPlanTaskDirect`), agendamento/reagendamento no Trigger.dev v3 e execução sob demanda.
- `step-agents-engine`: Pipeline modular `Tool → Walkthrough` dos 3 step agents (`video`, `concept_explainer`, `active_recall_quiz`) e do planejador de blueprint (`stepsPlan`).
- `task-session-execution`: Rota `/planos/[planId]/tasks/[taskId]`, preparação sob demanda na UI, progresso por step e conclusão com feedback para a próxima sessão JIT.

## Impact

- **Código e Rotas:** `lib/step-agents/*`, `lib/enrich-plan-task.ts`, `lib/trigger-jobs.ts`, `trigger/enrich-plan-task.ts`, `app/api/plan/handlers/accept-plan.ts`, `lib/task-reschedule.ts`, `app/actions/session.ts`, `app/(platform)/planos/[planId]/page.tsx`, `app/(platform)/planos/[planId]/plan-trail.tsx`, `app/(platform)/home/components/next-task-hero.tsx`, `app/(platform)/planos/[planId]/tasks/[taskId]/*`, `.github/workflows/trigger-deploy.yml`.
- **Integrações Externas:** OpenRouter (`models.fast`, `models.architect`, `models.jev`), YouTube Data API v3 (`YOUTUBE_API_KEY`), Supadata (`SUPADATA_API_KEY`), Firecrawl v2 (`FIRECRAWL_API_KEY`) e Trigger.dev (`TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_ID`).
