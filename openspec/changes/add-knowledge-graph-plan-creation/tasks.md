# Tasks

## 1. Persistência do contexto do aluno

- [x] 1.1 Adicionar `knowledgeGraph String?` ao model `User` em `prisma/schema.prisma`, rodar `npx prisma migrate dev` e `npx prisma generate`.
- [x] 1.2 Criar `lib/learner-context.ts` com `buildLearnerContext(userId)` (lê `User.knowledgeGraph`) e `updateLearnerContext(planId)` (chama `models.fast` para mesclar resumo anterior + `refinedGoal`, `rawInput` e `executableMeta.steps` do plano, salvando no `User`).

## 2. Injeção do knowledge graph no router

- [x] 2.1 Em `app/api/plan/route.ts`, incluir `knowledgeGraph` do `User` no `include`/`select` da query do plano.
- [x] 2.2 Propagar `knowledgeGraph` para `handleRefiningGoalStage` e `handleMetaPlanStage` (e os agentes correspondentes já aceitam o parâmetro).
- [x] 2.3 Após `handleGeneratingTasksStage` persistir a `planStructure` com sucesso, disparar `updateLearnerContext(planId)` de forma best-effort (log em caso de falha, sem bloquear a resposta).

## 3. Agenda ocupada na geração de tasks

- [x] 3.1 Criar `getOccupiedSlots(userId, excludePlanId)` em `lib/task-schedule.ts` (ou novo `lib/occupied-slots.ts`): retorna `{ dayOfWeek, startTime, durationMinutes }[]` distintos de `PlanTask` cujos planos estão `ACTIVE` ou `ENRICHING_TASKS`, excluindo o plano em criação.
- [x] 3.2 Estender `runGeneratingTasksAgent` (`lib/agents/generating-tasks.ts` + types) com `occupiedSlots` e instruir o prompt a não alocar sessões nesses horários.
- [x] 3.3 Passar `occupiedSlots` no router nas duas chamadas de `handleGeneratingTasksStage` (`adjust_plan` e `GENERATING_TASKS`).
- [x] 3.4 Expor `occupiedSlots` no `QuestionPayload` do `schedule_picker` (handler `interviewing-steps` anexa os slots quando a pergunta é `routine_and_slots`); `question-schedule.tsx` exibe os intervalos reservados por dia e bloqueia o submit em caso de sobreposição.

## 4. Validação de conflito no aceite

- [x] 4.1 Criar `findScheduleConflicts(newSlots, occupiedSlots)` (mesmo `dayOfWeek` + sobreposição de intervalos `[startTime, startTime+duration)`).
- [x] 4.2 Em `app/api/plan/handlers/accept-plan.ts`, antes da transação de criação das `PlanTask`, rejeitar com `409` + lista de horários conflitantes quando houver conflito.
- [x] 4.3 No client `criacao-plano`, tratar o `409` exibindo mensagem de conflito e oferecendo `adjust_plan` com feedback automático descrevendo os horários em conflito.

## 5. Documentação

- [x] 5.1 Atualizar `AGENTS.md` (knowledge graph no `User`, validação de agenda no aceite) e `steering/SPEC.md` se a arquitetura de criação de plano mudar.
