# Tasks: `jit-task-video-engine`

## 1. Contratos e Persistência em `PlanTask`
- [ ] 1.1 Atualizar `RequiredToolSchema` em `lib/agents/types.ts` para `["video", "concept_explainer", "guided_lab", "active_recall_quiz"]` e adicionar os schemas Zod de `PlanTaskContent` (`tools` + `steps` com `walkthrough`).
- [ ] 1.2 Atualizar `lib/agents/generating-tasks.ts` para usar os novos `requiredTools` no prompt e schema de saída.
- [ ] 1.3 Atualizar `app/api/plan/handlers/generating-tasks.ts` para gravar/substituir as linhas em `PlanTask` (`enrichmentStatus: "PENDING"`, `order: 1` como `AVAILABLE` e demais como `LOCKED`).

## 2. Motor de Busca e Recorte de Vídeo (`lib/tools/video/`)
- [ ] 2.1 Criar `lib/tools/video/types.ts` e interface `VideoSearchProvider` desacoplada.
- [ ] 2.2 Implementar busca no YouTube + filtro determinístico (`120s <= duration <= 5400s`, `embeddable === true`).
- [ ] 2.3 Implementar extrator de transcrição timestamped agrupada em blocos de 30 segundos (com fallback para capítulos da descrição).
- [ ] 2.4 Implementar `Segment Slicer` (`models.fast`) para definir `watchStartSeconds`, `watchEndSeconds`, `keyMoments` e `transcriptSummary` dentro de `consumeMinutes`.
- [ ] 2.5 Integrar `checkWithJev` para validar o alinhamento do trecho recortado com o objetivo da task.

## 3. Agente JIT (`Tool → Walkthrough`) e Endpoint
- [ ] 3.1 Criar `lib/agents/enrich-task.ts` que recebe uma `PlanTask` (+ feedback da task anterior), resolve as tools necessárias e sintetiza `content.steps` com `walkthrough` passo a passo.
- [ ] 3.2 Criar endpoint/action para disparar o enriquecimento JIT da task do dia com lock otimista (`PENDING → GENERATING → READY/FAILED`).
- [ ] 3.3 Validar o fluxo ponta a ponta com `npx tsc --noEmit` e teste de geração de 1 task real com vídeo do YouTube.
