# Design

## Context

Os agentes `runRefiningGoalAgent` (`lib/agents/refining-goal.ts`) e `runMetaPlanAgent` (`lib/agents/meta-plan.ts`) já declaram `knowledgeGraph?: string | null` e o incorporam ao prompt quando presente, mas `app/api/plan/route.ts` nunca fornece o valor. A agenda semanal de cada plano fica materializada em duas fontes: `planStructure.routineContract.slots` (JSON) e as linhas de `PlanTask` (`dayOfWeek`, `startTime`, `durationMinutes`). O aceite do plano acontece em `app/api/plan/handlers/accept-plan.ts`, dentro de transação que cria as `PlanTask` — ponto natural para a validação de conflito.

## Goals / Non-Goals

**Goals:**
- Persistir um resumo do contexto do aluno no `User` e injetá-lo nas etapas `REFINING_GOAL` e meta-plano.
- Alimentar o agente `generating-tasks` com os slots ocupados por planos ativos.
- Exibir e bloquear horários ocupados na coleta da rotina (`schedule_picker`), antes da geração.
- Garantir no `accept_plan` que a agenda aprovada não conflita com planos ativos (checagem determinística, não delegada ao LLM).

**Non-Goals:**
- Grafo de conhecimento estruturado por domínio/relações (Future Goal no Trello).
- Resolução automática de conflitos (reagendamento); apenas bloqueio + mensagem, mantendo `adjust_plan` como caminho de correção.
- Mudanças em `planStructure` existente ou em planos já ativos.

## Decisions

### 1. Knowledge graph como resumo textual persistido em `User.knowledgeGraph`

Campo `String?` (texto corrido em pt-BR, ~1-2KB) em vez de `Json` estruturado. Os agentes consomem texto no prompt; um resumo em linguagem natural é direto, barato e compatível com o parâmetro existente. Atualizado por LLM (`models.fast`) ao final da geração do plano (`GENERATING_TASKS` concluído), mesclando o resumo anterior com os novos dados do plano — alternativa de recomputar do zero a cada request foi descartada por custo/latência no hot path do router.

- Fonte de verdade para o merge: `refinedGoal`, `executableMeta.steps` preenchidos e `rawInput` do plano recém-criado + `knowledgeGraph` anterior do `User`.
- Falhas na atualização do resumo são *best-effort*: não bloqueiam a criação do plano (log + segue).

### 2. Agenda ocupada derivada de `PlanTask` (não de `planStructure`)

`PlanTask` é relacional e indexada — consulta direta por `plan.userId` com `status != COMPLETED/SKIPPED` em planos `stage = ACTIVE`. Extrai-se o conjunto distinto `{ dayOfWeek, startTime, durationMinutes }` e passa-se ao `generating-tasks` como `occupiedSlots`, com instrução no prompt para não alocar sessões nesses horários. `routineContract.slots` seria alternativa, mas `PlanTask` reflete o estado pós-reschedule — mais fiel à realidade.

### 3. Constraint aplicada na coleta (schedule picker), não só na validação final

Os `occupiedSlots` trafegam pelo `QuestionPayload` até `question-schedule.tsx` (`app/components/ai/`), que é onde a rotina é de fato escolhida. O input nativo `type="time"` não permite desabilitar faixas de horário, então a UX adota **visibilidade + bloqueio**:

- Ponto coral `#FF9B85` sob os botões dos dias que possuem reserva (descoberta antes do clique, acessível via `sr-only`).
- Ao selecionar o dia, linha quiet de reserva alinhada à coluna do horário: `"Já reservado por outro plano: 19:00–19:45"` (texto muted `#646B82`, `tabular-nums`, dot coral — mesma linguagem visual do resto do componente).
- Submit bloqueado com erro inline apontando dia, horário e faixa conflitante (mesmo algoritmo de sobreposição de intervalos da decisão 4).

Isso elimina o "seletor cego": a restrição aparece na fonte, não só após a geração.

### 4. Validação determinística de conflito no `accept_plan`

Antes de criar as `PlanTask` na transação, comparar cada slot da `planStructure` aprovada com os slots ocupados (mesma query da decisão 2): conflito = mesmo `dayOfWeek` com intervalos `[startTime, startTime+duration)` sobrepostos. Conflito → `409` com lista dos horários conflitantes; o client de `criacao-plano` exibe o erro e oferece `adjust_plan` com feedback automático descrevendo os conflitos. LLM pode ignorar a instrução do prompt — a validação no aceite é o gate real.

## Risks / Trade-offs

- [Resumo do knowledge graph fica desatualizado se a geração falhar no meio] → Atualização só roda após `planStructure` persistida; falha vira log, sem retry.
- [LLM ainda agenda em slot ocupado apesar do prompt] → Camada 1 (bloqueio na coleta) impede a rotina conflitante de chegar ao LLM; camada 2 (prompt com `occupiedSlots`) cobre alocações fora da rotina informada; camada 3 (`409` no aceite) fecha a corrida entre entrevista e aceite.
- [Plans em `stage` intermediários (GENERATING_TASKS, ENRICHING_TASKS) também reservam agenda] → Tratar como ocupados apenas planos `ACTIVE` e os em criação com `planStructure` já gerada; decisão: ocupam só `ACTIVE` + `ENRICHING_TASKS` para não bloquear rascunhos abandonados.
- [Mudança de timezone entre planos] → Slots são comparados em `dayOfWeek`/`startTime` locais do usuário (`User.timezone` único por usuário), consistente com o modelo atual.

## Migration Plan

1. Migration `20261125180000_add_user_knowledge_graph` (`ALTER TABLE "User" ADD COLUMN "knowledgeGraph" TEXT`) + `prisma generate`.
2. Deploy normal: campo nullable, retrocompatível; usuários existentes simplesmente começam sem contexto.
3. Rollback: revert do commit + migration reversa (drop da coluna) — sem dados críticos acumulados.
4. Nota operacional: em ambientes onde `prisma migrate deploy` não alcança o pooler do Supabase (`P1001`), a migration pode ser aplicada via SQL direto + insert na `_prisma_migrations` (checksum SHA-256 do arquivo) — aplicado assim em dev em 2026-11-25.

## Open Questions

- Formato/tamanho ideal do resumo do knowledge graph (limite de caracteres) pode ser ajustado após observar a qualidade das personalizações em produção.
