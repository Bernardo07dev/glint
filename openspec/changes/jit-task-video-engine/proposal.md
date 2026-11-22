# Proposal: `jit-task-video-engine`

## Why

Atualmente, a criação do plano (`GENERATING_TASKS`) gera o esqueleto das sessões de estudo dentro de um único JSONB em `LearningPlan.planStructure`, e a etapa seguinte (`ENRICHING_TASKS`) previa enriquecer todas as tasks antecipadamente em background. Isso gera dois problemas:

1. **Desperdício de tokens e latência:** Se o usuário desistir do plano, mudar de objetivo ou reagendar sessões, todo o conteúdo pré-gerado para tasks futuras é perdido.
2. **Falta de adaptação contínua:** Conteúdos gerados no dia 1 não conseguem incorporar o feedback real do aluno (`difficultyRating`, `userNotes`) da sessão anterior.
3. **Ausência de um motor real de vídeo e walkthrough:** Recomendar vídeos via LLM gera alucinação de URLs e instruções genéricas. É preciso resolver primeiro a **Tool** (buscar vídeo real, validar embed e recortar timestamps pela transcrição) para depois sintetizar o **Walkthrough** passo a passo ancorado no material real.

## What Changes

- **Persistência relacional em `PlanTask`:** Utilizar a tabela `PlanTask` (`prisma/schema.prisma`) como fonte da verdade para cada sessão do plano, separando agenda/progresso do `content` gerado Just-In-Time (JIT).
- **Ciclo de Vida Just-In-Time (JIT):** Na criação do plano, gravar apenas o esqueleto das tasks com `enrichmentStatus = PENDING`. O enriquecimento ocorre sob demanda apenas para a task do dia (ou véspera).
- **Padronização das 4 Tools Principais:** Consolidar `requiredTools` em `["video", "concept_explainer", "guided_lab", "active_recall_quiz"]`, mantendo `video` agnóstico de provedor (Fase 1: YouTube).
- **Pipeline `Tool → Walkthrough`:** Garantir em código e schema Zod que o agente JIT primeiro resolve as tools necessárias e só depois gera os `steps` com `walkthrough` detalhado citando o insumo real da tool.
- **Motor de Vídeo (`video` — Fase YouTube):** Implementar busca no YouTube, filtro determinístico (duração/embed), extração de transcrição com timestamps agrupada em blocos, recorte cirúrgico (`watchStartSeconds` / `watchEndSeconds`) dentro de `consumeMinutes` e validação via `checkWithJev`.

### Out of Scope (nesta change)
- Implementação dos motores completos de `concept_explainer`, `guided_lab` e `active_recall_quiz` (serão changes próprias após validação do motor `video`, embora o contrato base de `PlanTask.content` já os preveja).
- Auto-hospedagem/corte físico de vídeos Creative Commons em R2/Mux.

## Capabilities

### New Capabilities
- `jit-task-lifecycle`: Persistência do esqueleto em `PlanTask`, estados `PENDING → GENERATING → READY` e geração Just-In-Time da sessão do dia considerando o feedback da sessão anterior.
- `video-tool-engine`: Motor de busca, filtragem determinística, extração de transcrição timestamped, recorte de janela (`watchStartSeconds`/`watchEndSeconds`) e validação com Jev Judge para a tool `video`.

### Modified Capabilities
- `plan-generation`: Atualizar `generating-tasks` para persistir linhas em `PlanTask` ao criar/ajustar o plano, mantendo compatibilidade com `LearningPlan.planStructure` para o cabeçalho (`objective` + `routineContract`).

## Impact

- `prisma/schema.prisma` (já migrado com `PlanTask`)
- `lib/agents/types.ts` (schemas Zod de `PlanTask.content`: `tools` + `steps` com `walkthrough`)
- `app/api/plan/handlers/generating-tasks.ts` (gravação/atualização de `PlanTask` no Postgres)
- `lib/tools/video/` (novo módulo do motor de busca e recorte no YouTube)
- `lib/agents/enrich-task.ts` (novo agente JIT `Tool → Walkthrough`)
