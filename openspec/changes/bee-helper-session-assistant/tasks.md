# Tasks: `bee-helper-session-assistant`

## 1. Infraestrutura e Backend de Streaming

- [x] 1.1 Extrair cliente compartilhado do Firecrawl v2 em `lib/infra/firecrawl.ts` (`searchWebWithFirecrawlV2`, `normalizeHttpUrl`, `getHostnameLabel`) e atualizar `lib/step-agents/concept-explainer-agent.ts`.
- [x] 1.2 Implementar Route Handler `POST /api/plan/[planId]/tasks/[taskId]/bee` (`app/api/plan/[planId]/tasks/[taskId]/bee/route.ts`) com `maxDuration = 60`, autenticação `getSessionUser()`, montagem de contexto em 3 níveis (Plano → Task → Step), guarda socrática no quiz e `streamText` com `models.lowCost` + tool `web_search`.

## 2. Interface e Experiência Visual (`SessionStep` & `BeeHelperPanel`)

- [x] 2.1 Adicionar botão circular da Bee Helper em `SessionStep` (`session-step.tsx`), fixo na barra lateral no desktop e como FAB com auto-hide ao rolar no mobile.
- [x] 2.2 Construir o painel `BeeHelperPanel` (`bee-helper-panel.tsx`) saindo de baixo (`bottom-0 rounded-t-3xl`), alinhado ao lado do card principal cobrindo os widgets no desktop (`lg:top-[4.75rem] lg:left-[calc(50%+23.25rem)] lg:right-3`).
- [x] 2.3 Implementar barra superior com botão `"Nova sessão"` (`Plus`) e indicador circular (`conic-gradient`) sincronizado com `{completedWalkthrough}/{totalWalkthrough}` itens concluídos do roteiro.
- [x] 2.4 Implementar streaming NDJSON no cliente, frases aleatórias de pensamento (`THINKING_PHRASES`) com shimmer contínuo (`.bee-shimmer-text` em `app/globals.css`), dropdown recolhível de fontes (`SourcesDropdown`) no topo da resposta e `<textarea>` auto-expansível na base.
- [x] 2.5 Propagar `LiveQuizState` de `RecallQuiz` → `StepStage` → `TaskSessionClient` → `SessionStep` → `BeeHelperPanel` para acionar a guarda socrática em tempo real.
