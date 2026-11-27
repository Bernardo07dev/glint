# Proposal: `conversational-replan`

## Why

Ao contrário do modal **"Imprevisto hoje?"** (`reschedule-modal.tsx`), que apenas empurra a sessão atual para o próximo slot da rotina já contratada, o aluno precisa poder refatorar qualquer aspecto de um `LearningPlan` ativo (dias/horários, duração das sessões, dificuldade, foco prático/teórico ou objetivo final) ao longo da jornada sem perder o progresso já concluído.

## What Changes

- **Modelagem de Histórico de Versões (`prisma/schema.prisma`):**
  - Adição do enum `ReplanStrategy` (`SCHEDULE_ONLY`, `PARTIAL_REPLAN`, `GOAL_PIVOT`) e da tabela `PlanReplan` (`version`, `strategy`, `reasonSummary`, `oldPlan`, `newPlan`), gravada exclusivamente na confirmação (`apply`) com o esqueleto do `planStructure` (< 10 KB por versão).
- **Motor e Agente de Replan em 2 Estágios (`lib/agents/replan.ts`):**
  - `partitionPlanTasks`: separa `frozenTasks` (`COMPLETED | SKIPPED | IN_PROGRESS`) de `mutableTasks` (`LOCKED | AVAILABLE`) e calcula `nextOrderStart`.
  - `reflowTasksToNewSlots`: reflow determinístico em TypeScript para `SCHEDULE_ONLY`, preservando `content` de sessões já `READY`.
  - `runReplanTurn`: triagem com `models.fast` + `checkWithJev` (teto de 3 turnos, todos os schemas Zod compatíveis com Structured Outputs `strict: true` via `.nullable()`) e compilação com `models.architect` para `PARTIAL_REPLAN` / `GOAL_PIVOT`.
- **Route Handler de Replan (`app/api/plan/[planId]/replan/route.ts`):**
  - `mode: "turn"` (stateless/efêmero) e `mode: "apply"` (validação `findScheduleConflicts` → `409`, transação Prisma gravando `PlanReplan` + atualizando `PlanTask` e `LearningPlan`, reconciliação de runs no Trigger.dev e atualização assíncrona de `User.knowledgeGraph`).
- **Experiência em Tela Cheia (`app/(platform)/planos/[planId]/replan/`):**
  - Gatilhos **"Ajustar plano"** em `app/(platform)/planos/planos-list.tsx` (menu de 3 pontos) e `app/(platform)/planos/[planId]/plan-trail.tsx` (cabeçalho da trilha).
  - `page.tsx` + `replan-client.tsx` com a mesma UI em tela cheia da criação de plano (`AnimatedLogo`, `QuestionRenderer`, `HoneycombLoader` e tela de Preview de Diff).

## Capabilities

### New Capabilities
- `conversational-replan`: Refatoração conversacional de planos ativos com preservação de histórico concluído, versionamento em `PlanReplan` e reconciliação atômica com Trigger.dev.

## Impact

- **Banco de Dados:** `prisma/schema.prisma` e migration `20261127040653_add_plan_replan`.
- **Código e Rotas:** `lib/agents/replan.ts`, `app/api/plan/[planId]/replan/route.ts`, `app/(platform)/planos/[planId]/replan/page.tsx`, `app/(platform)/planos/[planId]/replan/replan-client.tsx`, `app/(platform)/planos/[planId]/plan-trail.tsx`, `app/(platform)/planos/planos-list.tsx`.
