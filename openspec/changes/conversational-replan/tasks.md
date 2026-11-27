# Tasks: `conversational-replan`

## 1. Banco de Dados (`prisma/`)

- [x] 1.1 Adicionar enum `ReplanStrategy` e model `PlanReplan` em `prisma/schema.prisma`.
- [x] 1.2 Criar e aplicar a migration `20261127040653_add_plan_replan` (`npx prisma migrate dev` + `npx prisma generate`).

## 2. Agente de Replan e Route Handler (`lib/agents/` & `app/api/`)

- [x] 2.1 Implementar `lib/agents/replan.ts` com `partitionPlanTasks`, `reflowTasksToNewSlots` (determinístico para `SCHEDULE_ONLY`) e `runReplanTurn` (triagem `models.fast` + `checkWithJev` com schemas `.nullable()` strict-compatible + compilação `models.architect`).
- [x] 2.2 Implementar `app/api/plan/[planId]/replan/route.ts` suportando `mode: "turn"` e `mode: "apply"` (validação `409`, transação atômica com `PlanReplan` + `PlanTask` + `LearningPlan`, reconciliação Trigger.dev e `updateLearnerContext`).

## 3. Interface em Tela Cheia (`app/(platform)/planos/`)

- [x] 3.1 Adicionar gatilhos `"Ajustar plano"` em `app/(platform)/planos/planos-list.tsx` (menu de 3 pontos) e `app/(platform)/planos/[planId]/plan-trail.tsx` (cabeçalho da trilha).
- [x] 3.2 Implementar `app/(platform)/planos/[planId]/replan/page.tsx` e `replan-client.tsx` com UI em tela cheia (`AnimatedLogo`, `QuestionRenderer`, `HoneycombLoader` e Preview de Diff).
