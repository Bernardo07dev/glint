# bee-helper Specification

## Purpose

Prover a **Bee Helper**, assistente contextual efêmera de IA que acompanha o aluno dentro de cada sessão de estudo (`/planos/[planId]/tasks/[taskId]`), oferecendo um canal rápido de tira-dúvidas em streaming (`models.lowCost` / `anthropic/claude-haiku-5.5`) com consciência em 3 níveis (Plano → Task → Step Atual), guarda socrática nos steps de `active_recall_quiz` e ferramenta de busca web sob demanda (`web_search` via Firecrawl v2).

## Requirements

### Requirement: Gatilho Circular da Bee Helper (Barra Lateral Desktop e FAB Mobile com Auto-Hide)
Em `SessionStep` (`app/(platform)/planos/[planId]/tasks/components/tools/session-step.tsx`), a interface SHALL exibir o botão circular da Bee Helper (`WidgetId = "walkthrough" | "objective" | "bee"`), compartilhando o estado `openWidget` para que apenas um widget fique aberto por vez. No desktop (`lg:`), o botão permanece na barra lateral `<aside>`; no mobile (`< lg`), atua como um FAB fixo acima da bottom tab bar que desaparece suavemente ao rolar para baixo e reaparece ao rolar para cima.

#### Scenario: Acionamento e comportamento de scroll do botão da Bee
- **WHEN** o aluno visualiza um step ativo em `/planos/[planId]/tasks/[taskId]`
- **THEN** o botão circular exibe a `MascotBee` na pose `curious` (quando fechado) ou `focus` (quando aberto), oculta-se no mobile ao rolar para baixo (`delta > 6`) e reaparece ao rolar para cima (`delta < -6`) ou no topo da página.

### Requirement: Painel de Chat Efêmero Saindo de Baixo (`BeeHelperPanel`)
Ao abrir `openWidget === "bee"`, `BeeHelperPanel` (`app/(platform)/planos/[planId]/tasks/components/tools/bee-helper-panel.tsx`) SHALL renderizar um container saindo de baixo (`bottom-0 rounded-t-3xl` com transição `translate-y-full → translate-y-0`), posicionado no desktop ao lado do card principal cobrindo a coluna de widgets (`lg:top-[4.75rem] lg:left-[calc(50%+23.25rem)] lg:right-3`), mantendo histórico 100% efêmero em memória no cliente.

#### Scenario: Barra superior com reinício de conversa e indicador circular de progresso do roteiro
- **WHEN** o painel da Bee está aberto
- **THEN** o topo esquerdo exibe o botão `"Nova sessão"` com ícone `Plus` (que aborta streams ativos e limpa `messages[]`) ao lado de um anel circular (`conic-gradient`) preenchido conforme `{completedWalkthrough}/{totalWalkthrough}` itens concluídos pelo aluno, e o topo direito exibe o botão de fechar (`Xmark`, também acionável via `Escape`).

#### Scenario: Zero-State com atalhos contextuais e textarea auto-expansível
- **WHEN** `messages` está vazio
- **THEN** o painel exibe a `MascotBee` (`curious`), chamada em `Fraunces` e atalhos rápidos específicos da `toolRef` ativa (`video`, `concept_explainer` ou `active_recall_quiz`), além de um `<textarea rows={1}>` leve na base que cresce para cima até `max-h-28` antes de criar scroll interno e envia com `Enter`.

### Requirement: Streaming Multi-Step com Consciência em 3 Níveis e Busca Web (`POST /api/plan/[planId]/tasks/[taskId]/bee`)
O Route Handler `POST /api/plan/[planId]/tasks/[taskId]/bee` (`app/api/plan/[planId]/tasks/[taskId]/bee/route.ts`) SHALL autenticar o usuário via `getSessionUser()`, carregar `PlanTask`, `LearningPlan` e `User` no Prisma e executar `streamText` com `models.lowCost` (`anthropic/claude-haiku-5.5`), `stopWhen: stepCountIs(3)` e a tool `web_search` (`searchWebWithFirecrawlV2` em `lib/infra/firecrawl.ts`), transmitindo eventos NDJSON (`status`, `sources`, `text-delta`, `error`).

#### Scenario: Resposta em streaming com shimmer de pensamento e dropdown de fontes web
- **WHEN** o aluno envia uma dúvida ou clica em um atalho rápido
- **THEN** o painel exibe a `MascotBee` (`focus`) com uma frase aleatória de `THINKING_PHRASES` animada por shimmer contínuo (`.bee-shimmer-text`), troca para `"Pesquisando referências na web..."` caso o modelo invoque `web_search`, renderiza o dropdown recolhível `"Pesquisou na web · X fontes"` (`SourcesDropdown`) no topo da resposta quando houver fontes e transmite o Markdown em tempo real.

### Requirement: Guarda Socrática no Quiz de Fixação (`active_recall_quiz`)
Quando o step ativo utiliza `toolRef === "active_recall_quiz"`, o backend SHALL verificar `liveStepContext.quizState.phase` antes de montar o prompt do sistema.

#### Scenario: Aluno pede ajuda antes de confirmar a alternativa
- **WHEN** `quizState.phase === "answering"` (resposta ainda não confirmada pelo aluno)
- **THEN** o backend omite `correctOptionId` e `explanation` do contexto enviado ao LLM e instrui a Bee a atuar como tutora socrática (dando dicas conceituais sem revelar a alternativa correta); somente após `quizState.phase === "confirmed"` o gabarito e a explicação oficial são incluídos.
