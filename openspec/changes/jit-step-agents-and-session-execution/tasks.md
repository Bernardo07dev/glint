# Tasks: `jit-step-agents-and-session-execution`

## 1. Ajustes de Contrato e Step Agents (`lib/step-agents/`)
- [x] 1.1 Validar chaves de API (`.env`) e atualizar `steering/TaskCreation.md` com conversão `ms → s` da Supadata, endpoint `/v2/search` do Firecrawl v2 e separação entre schemas planos de LLM e schemas de validação final (`lib/task-content.ts`).
- [x] 1.2 Criar `lib/step-agents/types.ts` com `StepsPlanSchema`, `StepAgentTaskContext`, `PreviousTaskFeedback` e formatadores de perfil e feedback.
- [x] 1.3 Criar `lib/step-agents/blueprint.ts` (`runBlueprintAgent`) garantindo 1 step único por `ToolId` na ordem pedagógica (`video` → `concept_explainer` → `active_recall_quiz`).
- [x] 1.4 Criar `lib/step-agents/video-agent.ts` (`runVideoStepAgent`) com Query Planner, 3 buscas na YouTube Data API v3 + hard filter em lote, transcrição Supadata (`ms → s`), Segment Slicer e `checkWithJev`.
- [x] 1.5 Criar `lib/step-agents/concept-explainer-agent.ts` (`runConceptExplainerStepAgent`) com Firecrawl v2 (`POST /v2/search`), fallback gracioso, síntese editorial em Markdown/Mermaid e filtro determinístico de `sources`.
- [x] 1.6 Criar `lib/step-agents/quiz-and-walkthrough-agent.ts` (`runQuizAndWalkthroughAgent`) gerando quiz dinâmico (2–5 questões), walkthrough ancorado nos insumos reais, validação `TaskContentSchema` e `jevAlignmentScore`.
- [x] 1.7 Criar `lib/step-agents/index.ts` com o orquestrador `runEnrichTaskPipeline` executando `video` e `concept_explainer` em paralelo via `Promise.all`.

## 2. Executor Atômico e Orquestração Trigger.dev
- [x] 2.1 Criar `lib/enrich-plan-task.ts` (`enrichPlanTaskDirect`) com lock atômico (`PENDING`/`FAILED` → `GENERATING` → `READY`/`FAILED`), callback `onBlueprintReady` e espelhamento em `LearningPlan.planStructure`.
- [x] 2.2 Criar o worker `trigger/enrich-plan-task.ts` (`id: "enrich-plan-task"`) delegando para `enrichPlanTaskDirect` e o workflow `.github/workflows/trigger-deploy.yml`.
- [x] 2.3 Criar `lib/trigger-jobs.ts` (`schedulePlanTasksOnAccept`, `reschedulePlanTaskRuns`, `triggerTaskOnDemand`) e integrar em `app/api/plan/handlers/accept-plan.ts` e `lib/task-reschedule.ts`.

## 3. Rota da Sessão (`/planos/[planId]/tasks/[taskId]`) e Server Actions
- [x] 3.1 Adicionar `enrichTaskNowAction`, `recordStepProgressAction` e `finishTaskSessionAction` em `app/actions/session.ts`.
- [x] 3.2 Criar `app/(platform)/planos/[planId]/tasks/[taskId]/page.tsx` e `task-session-client.tsx` com estado de preparação sob demanda, stepper `SessionStep` + `StepStage` e tela de fechamento com feedback.
- [x] 3.3 Conectar os botões de acesso à sessão em `app/(platform)/planos/[planId]/page.tsx`, `plan-trail.tsx` e `app/(platform)/home/components/next-task-hero.tsx`.
- [x] 3.4 Validar tipagem (`npx tsc --noEmit`), executar smoke test end-to-end do pipeline JIT e atualizar `AGENTS.md`.
