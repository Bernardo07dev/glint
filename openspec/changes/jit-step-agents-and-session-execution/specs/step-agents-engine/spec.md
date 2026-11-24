# step-agents-engine Specification

## Purpose

Executar o pipeline pedagógico Just-In-Time (`Tool → Walkthrough`) em `lib/step-agents/`, planejando o blueprint da sessão (`stepsPlan`), resolvendo em paralelo os insumos reais das tools `video` (YouTube Data API v3 + Supadata) e `concept_explainer` (Firecrawl v2 + Markdown/Mermaid) e sintetizando o `active_recall_quiz` e os `steps` com `walkthrough` validados por `TaskContentSchema`.

## ADDED Requirements

### Requirement: Planejamento de Blueprint com Unicidade de Tool por Sessão
O `runBlueprintAgent` (`lib/step-agents/blueprint.ts`) SHALL distribuir o orçamento de minutos da task em `PlanTask.stepsPlan` garantindo no máximo 1 step por `ToolId` oficial na ordem pedagógica `video` → `concept_explainer` → `active_recall_quiz` e registrando `adaptationNote` quando houver feedback da sessão anterior.

#### Scenario: Sessão com feedback anterior de dificuldade alta
- **WHEN** `runBlueprintAgent` recebe `previousFeedback` com `difficultyRating = "too_hard"` ou anotações em `userNotes`
- **THEN** o agente preenche `adaptationNote` orientando o reforço prático e gera exatamente 1 step para cada tool única de `requiredTools` somando `durationMinutes`.

### Requirement: Motor de Vídeo com YouTube Data API v3, Supadata (`ms → s`) e Jev Judge
O `runVideoStepAgent` (`lib/step-agents/video-agent.ts`) SHALL planejar 3 queries de busca, filtrar vídeos embeddables entre 120s e 5400s via YouTube Data API v3, extrair a transcrição na Supadata convertendo `offset` e `duration` de milissegundos para segundos, recortar `watchStartSeconds` e `watchEndSeconds` dentro do orçamento do step e validar o trecho com `checkWithJev` e `VideoToolSchema`.

#### Scenario: Busca, conversão de transcrição e recorte dentro do tempo de consumo
- **WHEN** o step requer a tool `video` com `estimatedMinutes` definido
- **THEN** o agente executa 3 chamadas `search.list` e 1 `videos.list`, descarta vídeos não-embeddables ou lives, converte os timestamps da Supadata de `ms` para `s` (`Math.floor(offset / 1000)`), define `watchStartSeconds < watchEndSeconds` com duração máxima `estimatedMinutes * 60` e retorna o objeto validado por `VideoToolSchema`.

### Requirement: Motor `concept_explainer` com Firecrawl v2 e Síntese Editorial Rica
O `runConceptExplainerStepAgent` (`lib/step-agents/concept-explainer-agent.ts`) SHALL pesquisar referências atualizadas via Firecrawl v2 (`POST /v2/search` com `sources: [{ type: "web" }]` e `scrapeOptions: { formats: ["markdown"], onlyMainContent: true }`), sintetizar um guia em Markdown com diagramas Mermaid (com rótulos entre aspas duplas), tabelas GFM e blocos de código, e anexar exclusivamente URLs reais retornadas pelo Firecrawl.

#### Scenario: Síntese com fontes retornadas pelo Firecrawl v2
- **WHEN** `/v2/search` retorna documentos com Markdown válido
- **THEN** o agente sintetiza a aula com `models.architect` e popula `sources` apenas com pares `{ title, url }` verificados presentes no retorno do Firecrawl, validando a saída em `ConceptExplainerSchema`.

#### Scenario: Fallback gracioso quando o Firecrawl retorna vazio ou falha
- **WHEN** `/v2/search` retorna 0 resultados ou sofre timeout
- **THEN** o agente registra aviso em log e sintetiza o guia completo com conhecimento próprio do modelo sem quebrar a geração da task e sem inventar URLs em `sources`.

### Requirement: Quiz Dinâmico e Síntese Final `Tool → Walkthrough`
O `runQuizAndWalkthroughAgent` (`lib/step-agents/quiz-and-walkthrough-agent.ts`) MUST ser executado somente após a resolução de `video` e `concept_explainer`, gerando de 2 a 5 questões dinâmicas em `active_recall_quiz` (com `correctOptionId` existente em `options` e explicações por alternativa), sintetizando o `walkthrough` de cada step ancorado nos timestamps e seções reais e validando o payload completo com `TaskContentSchema`.

#### Scenario: Montagem final da sessão após resolução paralela das tools
- **WHEN** `runEnrichTaskPipeline` conclui `runVideoStepAgent` e `runConceptExplainerStepAgent` em paralelo
- **THEN** `runQuizAndWalkthroughAgent` gera o quiz e os roteiros citando os minutos reais do vídeo e as seções do guia, valida o resultado em `TaskContentSchema.parse` e calcula `jevAlignmentScore` via `checkWithJev`.
