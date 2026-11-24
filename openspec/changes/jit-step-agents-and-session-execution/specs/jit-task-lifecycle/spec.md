# jit-task-lifecycle Specification

## Purpose

Gerenciar o ciclo de vida Just-In-Time (JIT) das sessões de estudo (`PlanTask`), incluindo agendamento em `T-10 min` na aceitação do plano, reagendamento em cascata, lock atômico anti-duplicidade (`PENDING`/`FAILED` → `GENERATING` → `READY`/`FAILED`), execução sob demanda e espelhamento em `LearningPlan.planStructure`.

## ADDED Requirements

### Requirement: Agendamento JIT na Aceitação do Plano
Ao aceitar um plano (`accept_plan`), o sistema SHALL criar todas as linhas `PlanTask` em transação com `enrichmentStatus = "PENDING"` e agendar um job `enrich-plan-task` no Trigger.dev para cada sessão usando `triggerAt` (`scheduledAt - 10 min` em UTC), disparando imediatamente sem `delay` caso `triggerAt <= now`.

#### Scenario: Aceitação de plano com primeira sessão para hoje e demais futuras
- **WHEN** o aluno confirma a criação do plano em `handleAcceptPlanStage`
- **THEN** o sistema grava as `PlanTask` no banco, dispara imediatamente o job da sessão cujo `triggerAt <= now`, agenda as sessões futuras com `{ delay: task.triggerAt }` e persiste o `triggerRunId` retornado em cada `PlanTask`.

### Requirement: Reagendamento Sincronizado de Runs Pendentes
Quando sessões são reagendadas em cascata (`reschedulePlanTasks`), o sistema SHALL atualizar no Trigger.dev apenas os runs das tasks movidas cujo `enrichmentStatus` seja `PENDING` ou `FAILED`, preservando intacto o conteúdo das tasks já em `GENERATING` ou `READY`.

#### Scenario: Aluno aciona "Imprevisto hoje?" em sessão ainda não enriquecida
- **WHEN** `reschedulePlanTasks` move datas de sessões com `enrichmentStatus` em `PENDING` ou `FAILED`
- **THEN** `reschedulePlanTaskRuns` reagenda o `previousTriggerRunId` para o novo `nextTriggerAt` (ou cria novo run caso não exista) e atualiza `triggerRunId` na tabela `PlanTask`.

### Requirement: Lock Atômico Anti-Duplicidade e Persistência Espelhada
O executor `enrichPlanTaskDirect` MUST adquirir um lock atômico no banco (`enrichmentStatus` de `PENDING` ou `FAILED` para `GENERATING`) antes de invocar LLMs ou APIs externas, persistir `stepsPlan` logo após o Estágio 1, gravar `content` validado com `enrichmentStatus = "READY"` espelhando em `LearningPlan.planStructure` e reverter para `FAILED` em caso de exceção.

#### Scenario: Concorrência entre job agendado e geração sob demanda
- **WHEN** duas execuções tentam enriquecer a mesma `PlanTask` simultaneamente
- **THEN** apenas a primeira transição `updateMany` (`PENDING`/`FAILED` → `GENERATING`) obtém `count = 1`, enquanto a segunda recebe `count = 0` e encerra imediatamente com `{ skipped: true }` sem gastar tokens.

#### Scenario: Falha durante a geração JIT
- **WHEN** ocorre um erro irrecuperável em qualquer estágio do `runEnrichTaskPipeline`
- **THEN** `enrichPlanTaskDirect` atualiza `enrichmentStatus` de `GENERATING` para `FAILED`, permitindo nova tentativa isolada ou sob demanda sem travar a sessão.
