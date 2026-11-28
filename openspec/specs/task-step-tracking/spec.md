# task-step-tracking Specification

## Purpose

Prover persistência granular e telemetria rica de cada step de uma sessão de estudo (`PlanTaskStepProgress` no PostgreSQL via Prisma), garantindo **restauração exata da UI** entre reloads/dispositivos (step ativo, checklist do Passo a Passo e estado exato do `RecallQuiz`), **trava de progressão (Gate)** com feedback visual leve e **injeção de telemetria real** nos agentes de IA (Bee Helper, Enriquecimento JIT da próxima task, Knowledge Graph e Replan).

## Requirements

### Requirement: Modelagem Relacional `PlanTaskStepProgress` e Ponteiro `PlanTask.currentStepId`
O schema Prisma (`prisma/schema.prisma`) SHALL definir o enum `StepProgressStatus` (`PENDING`, `IN_PROGRESS`, `COMPLETED`), o model `PlanTaskStepProgress` (com `@@unique([taskId, stepId])`, `order`, `phase`, `toolType`, `title`, `estimatedMinutes`, `status`, `totalChecklistItems`, `checkedItems`, `timeSpentSeconds`, `startedAt`, `completedAt`, `lastInteractionAt`, `quizData`) e os campos `currentStepId` e `stepProgress` em `PlanTask`.

#### Scenario: Nascimento automático no Enriquecimento JIT e Backfill de Compatibilidade
- **WHEN** `enrichPlanTaskDirect` (`lib/tasks/enrich-plan-task.ts`) finaliza o enriquecimento de uma `PlanTask` para `READY`
- **THEN** na mesma `$transaction`, cria 1 linha em `PlanTaskStepProgress` por step de `validatedContent.steps` (`status = PENDING`, `totalChecklistItems = walkthrough.length`, `checkedItems = []`) e define `PlanTask.currentStepId = steps[0].id`. Para tasks `READY` antigas sem linhas, `ensureTaskStepProgress` (`lib/tasks/step-progress.ts`) executa o backfill automático na primeira abertura da página (`app/(platform)/planos/[planId]/tasks/[taskId]/page.tsx`).

### Requirement: Restauração Exata do `RecallQuiz` (`StepQuizProgressSchema`)
O campo `PlanTaskStepProgress.quizData` SHALL ser validado por `StepQuizProgressSchema` (`lib/tasks/step-progress.ts`), armazenando `activeQuestionId`, `selectedOptionId`, `phase`, `isRetryRound`, `completed`, `questionQueueIds`, `currentRoundWrongQuestionIds`, `firstAttemptScore`, `firstAttemptWrongQuestionIds` e `attempts[]`.

#### Scenario: Reload ou troca de dispositivo no meio de uma rodada do Quiz
- **WHEN** o aluno recarrega a página durante a 1ª tentativa ou durante uma rodada de revisão (`isRetryRound = true`)
- **THEN** `RecallQuiz` (`app/(platform)/planos/[planId]/tasks/components/tools/recall-quiz.tsx`) reidrata exatamente a fila de questões, a questão ativa, a alternativa selecionada, os indicadores de acerto/erro da rodada e o estado final `done`.

### Requirement: Persistência Idempotente com Debounce e Timer Confiável de Tempo Real
As mutações durante a sessão (`app/actions/session.ts`) SHALL usar Optimistic UI no cliente e operações idempotentes no servidor:
- `updateStepChecklistAction`: recebe o array completo `checkedItems: number[]` após debounce de `350ms` por step no cliente e persiste via `checkedItems: { set: sanitized }`, eliminando race conditions em cliques rápidos.
- `selectStepAction`, `recordQuizAnswerAction` e `flushStepTimeAction`: registram troca de step, progresso do quiz e deltas de tempo (`timeSpentSeconds`, com cap de segurança por flush).
- O timer no cliente (`TaskSessionClient`) SHALL acumular segundos apenas quando `document.visibilityState === "visible"` e houver interação nos últimos 3 minutos, fazendo flush ao trocar de step, concluir o step ou ocultar a aba.

### Requirement: Gate de Progressão Obrigatório (UI + Servidor)
O aluno SHALL concluir todos os itens do checklist (`checkedItems.length === totalChecklistItems`) e finalizar o quiz (`quizData.completed === true`, quando `toolType === "active_recall_quiz"`) antes de avançar para o próximo step ou concluir a sessão.

#### Scenario: Tentativa de avançar com itens pendentes no Passo a Passo ou Quiz
- **WHEN** o aluno clica em *"Próximo passo"*, *"Concluir sessão"* ou tenta pular para um step futuro na `StepTrail` com pendências
- **THEN** a UI bloqueia o avanço, reabre o painel esquerdo na aba `Resumo` (se recolhido ou no mobile), faz scroll suave até o **Passo a Passo**, exibe a mensagem leve (`text-[#C85A54]/85`) e executa a animação circular SVG de borda (`.animate-gate-border-stroke`) ao redor do painel esquerdo; o servidor também rejeita transições inválidas em `recordStepProgressAction`. Steps anteriores continuam navegáveis livremente.

### Requirement: Consumo da Telemetria pelos Agentes de IA
Os dados de `PlanTaskStepProgress` SHALL alimentar diretamente os 4 pontos de inteligência do Glint:
1. **Bee Helper (`app/api/plan/[planId]/tasks/[taskId]/bee/route.ts`):** injeta status, checklist, tempo real vs. estimado e tentativas/erros do quiz no contexto em tempo real.
2. **Enriquecimento JIT (`lib/tasks/enrich-plan-task.ts` & `lib/step-agents/types.ts`):** injeta no `previousFeedback` da sessão `order - 1` o ritmo real, aderência ao checklist, placar da 1ª tentativa e os enunciados exatos das questões erradas na 1ª tentativa (`quizWrongQuestions`).
3. **Knowledge Graph (`lib/plan/learner-context.ts` & `finishTaskSessionAction`):** consolida ritmo real acumulado, aderência aos checklists e taxa de acerto de 1ª tentativa nos quizzes ao finalizar cada sessão.
4. **Replan (`lib/agents/replan.ts` & `app/api/plan/[planId]/replan/route.ts`):** inclui a telemetria real de `stepProgress` nas `frozenTasks` para calibrar `PARTIAL_REPLAN` e `GOAL_PIVOT`.
