# conversational-replan Specification (Delta)

## ADDED Requirements

### Requirement: Acesso ao Replan Conversacional e Interface em Tela Cheia (`/planos/[planId]/replan`)
A plataforma SHALL disponibilizar o atalho **"Ajustar plano"** tanto no menu de opções (`EllipsisVertical`) da listagem de planos (`app/(platform)/planos/planos-list.tsx`) quanto no cabeçalho da trilha do plano (`app/(platform)/planos/[planId]/plan-trail.tsx`), abrindo a rota `/planos/[planId]/replan` com a mesma experiência visual em tela cheia da criação de plano (`QuestionRenderer` sobre `#FFFDF8` + `HoneycombLoader`).

#### Scenario: Aluno inicia o fluxo de replan
- **WHEN** o aluno clica em "Ajustar plano" em um plano ativo
- **THEN** a página `/planos/[planId]/replan` exibe a pergunta inicial estruturada (`single_choice` com `allowCustom: true`) mantendo a conversa 100% efêmera no estado do cliente até a confirmação.

### Requirement: Arquitetura de Agente em 2 Estágios (`lib/agents/replan.ts`)
O módulo `lib/agents/replan.ts` SHALL particionar as tasks do plano em `frozenTasks` (`COMPLETED | SKIPPED | IN_PROGRESS`, imutáveis) e `mutableTasks` (`LOCKED | AVAILABLE`, futuras) e executar cada turno (`mode: "turn"`) em 2 estágios: Triagem (`models.fast` + `checkWithJev` com teto de 3 turnos) e Compilação (`reflowTasksToNewSlots` determinístico ou `models.architect`).

#### Scenario: Mudança apenas de dias e horários (`SCHEDULE_ONLY`)
- **WHEN** a triagem classifica `strategy === "SCHEDULE_ONLY"` e o aluno seleciona os novos horários no `schedule_picker`
- **THEN** `reflowTasksToNewSlots` recalcula deterministicamente as datas e horários das `mutableTasks` em TypeScript puro (sem chamada ao `models.architect`), preservando o `content` das tasks já `READY`.

#### Scenario: Mudança de ritmo, foco, duração ou objetivo (`PARTIAL_REPLAN` | `GOAL_PIVOT`)
- **WHEN** `checkWithJev` aprova que há clareza suficiente (ou o limite de 3 turnos é atingido) para `PARTIAL_REPLAN` ou `GOAL_PIVOT`
- **THEN** `models.architect` gera apenas `newFutureTasks` numeradas a partir de `nextOrderStart = max(frozenTasks.order) + 1`, `summaryOfChanges` e (em `GOAL_PIVOT`) o novo `objective`, sem repetir temas já concluídos em `frozenTasks`.

### Requirement: Histórico de Versões (`PlanReplan`) e Reconciliação Atômica (`mode: "apply"`)
Ao confirmar o preview (`POST /api/plan/[planId]/replan` com `mode: "apply"`), o backend SHALL validar conflitos de agenda com outros planos ativos (`findScheduleConflicts` → `409`), gravar a nova versão em `PlanReplan` (`oldPlan`, `newPlan` apenas como esqueleto do `planStructure`) dentro de `prisma.$transaction`, atualizar `PlanTask` e `LearningPlan`, e reconciliar os jobs agendados no Trigger.dev após o commit.

#### Scenario: Confirmação e aplicação atômica do replan
- **WHEN** o aluno revisa o Preview de Diff e clica em "Aplicar mudanças"
- **THEN** o backend valida conflitos, cria o registro `PlanReplan` (`version = count + 1`), atualiza `mutableTasks` in-place (em `SCHEDULE_ONLY`) ou substitui por `newFutureTasks` (em `PARTIAL_REPLAN` / `GOAL_PIVOT`), sincroniza `LearningPlan.planStructure` / `totalTasks` / `refinedGoal`, cancela/reagenda os runs no Trigger.dev e atualiza `User.knowledgeGraph` em background.
