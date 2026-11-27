# Proposal: `bee-helper-session-assistant`

## Why

Durante uma sessão de estudo (`/planos/[planId]/tasks/[taskId]`), o aluno percorre etapas guiadas (`video`, `concept_explainer` e `active_recall_quiz`), cada uma com roteiro passo a passo (`walkthrough`) e entregável (`deliverable`). Quando surge uma dúvida pontual sobre um comando do roteiro, um conceito ou uma questão do quiz, sair da plataforma quebra o foco. A **Bee Helper** resolve isso oferecendo uma mentora contextual efêmera dentro da própria sessão, com consciência em 3 níveis (Plano → Task → Step Atual), guarda socrática no quiz e pesquisa web sob demanda via Firecrawl v2.

## What Changes

- **Infraestrutura Compartilhada Firecrawl v2 (`lib/infra/firecrawl.ts`):**
  - Extração de `searchWebWithFirecrawlV2`, `normalizeHttpUrl` e `getHostnameLabel` a partir de `lib/step-agents/concept-explainer-agent.ts`, suportando parâmetros de baixa latência para o chat (`limit: 3`, `timeoutMs: 12000`, `maxCharsPerDoc: 2500`).
- **Route Handler de Streaming (`app/api/plan/[planId]/tasks/[taskId]/bee/route.ts`):**
  - Endpoint `POST` com `maxDuration = 60` que autentica a sessão (`getSessionUser`), busca `PlanTask` + `LearningPlan` + `User` (`name`, `knowledgeGraph`), constrói o System Prompt em 3 níveis com guarda socrática para `active_recall_quiz` e transmite eventos NDJSON (`status`, `sources`, `text-delta`, `error`) usando `streamText` (`models.lowCost` = `anthropic/claude-haiku-5.5`, `stopWhen: stepCountIs(3)` e tool `web_search`).
- **UI da Bee Helper (`app/(platform)/planos/[planId]/tasks/components/tools/bee-helper-panel.tsx` & `session-step.tsx`):**
  - Botão circular da Bee na barra lateral `<aside>` no desktop e FAB fixo com auto-hide por direção de scroll no mobile.
  - Painel `BeeHelperPanel` saindo de baixo (`bottom-0 rounded-t-3xl`), alinhado ao lado do card principal e cobrindo os widgets no desktop (`lg:top-[4.75rem] lg:left-[calc(50%+23.25rem)] lg:right-3`).
  - Barra superior com botão `"Nova sessão"` (`Plus`) + indicador circular (`conic-gradient`) do progresso do `walkthrough` (`{completed}/{totalWalkthrough}`) e botão de fechar (`Xmark`).
  - Estados de loading com frases aleatórias (`THINKING_PHRASES`) e efeito `.bee-shimmer-text` (`app/globals.css`), dropdown recolhível de fontes (`SourcesDropdown`) no topo da resposta e `<textarea>` auto-expansível na base.
  - Propagação de `LiveQuizState` a partir de `RecallQuiz` → `StepStage` → `TaskSessionClient` → `SessionStep` → `BeeHelperPanel`.

## Capabilities

### New Capabilities
- `bee-helper`: Assistente contextual efêmera de sessão com consciência em 3 níveis (Plano → Task → Step), guarda socrática no quiz, busca web via Firecrawl v2 e streaming em tempo real.

## Impact

- **Código e Rotas:** `lib/infra/firecrawl.ts`, `lib/step-agents/concept-explainer-agent.ts`, `app/api/plan/[planId]/tasks/[taskId]/bee/route.ts`, `app/(platform)/planos/[planId]/tasks/components/tools/bee-helper-panel.tsx`, `app/(platform)/planos/[planId]/tasks/components/tools/session-step.tsx`, `app/(platform)/planos/[planId]/tasks/components/tools/recall-quiz.tsx`, `app/(platform)/planos/[planId]/tasks/components/tools/step-stage.tsx`, `app/(platform)/planos/[planId]/tasks/[taskId]/task-session-client.tsx`, `app/(platform)/planos/[planId]/tasks/[taskId]/page.tsx`, `app/globals.css`.
- **Integrações Externas:** OpenRouter (`models.lowCost` / `anthropic/claude-haiku-5.5`) e Firecrawl v2 (`POST https://api.firecrawl.dev/v2/search`).
