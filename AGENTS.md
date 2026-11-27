# Glint

> **Regra de Manutenção Contínua (Para Agentes de IA):**
> Este arquivo (`AGENTS.md`) é a fonte da verdade viva sobre o produto. **A cada nova mudança, decisão de produto, definição de design ou evolução do projeto, a IA responsável pela alteração DEVE atualizar este `AGENTS.md`** para que ele reflita sempre o estado atual do Glint.

---

## Visão Geral

O **Glint** é uma plataforma de ensino com Inteligência Artificial desenhada para transformar qualquer tema que uma pessoa queira aprender em uma jornada estruturada, realista e totalmente moldada à vida real dela.

O grande problema de aprender algo novo por conta própria ou usando chats de IA convencionais é a falta de direção, continuidade e adaptação à rotina. Respostas soltas não constroem conhecimento de longo prazo, e cursos prontos ignoram quem é o aluno. O Glint resolve isso agindo como um mentor pessoal que primeiro entende profundamente você, depois desenha um plano claro de várias semanas, organiza esse plano no seu calendário e acompanha sua execução diariamente.

---

## Como o Glint Funciona (A Ideia Central)

### 1. Escolha do Tema e Entrevista Inicial
Tudo começa quando o usuário informa o que deseja aprender (pode ser programação, um idioma, finanças, música, culinária, um assunto acadêmico ou qualquer habilidade específica). Em vez de despejar conteúdo imediatamente, o Glint inicia uma **conversa investigativa**. Ele faz perguntas estratégicas para descobrir:
- Qual é a motivação real por trás daquele estudo;
- O que a pessoa já sabe sobre o assunto e quais são suas dificuldades;
- Qual é o resultado concreto que ela quer alcançar ao final da jornada.

### 2. Conhecimento Profundo sobre Quem é o Usuário
Para que o aprendizado funcione de verdade, o Glint precisa conhecer a pessoa além do tema de estudo. Durante a interação (e continuamente ao longo do uso), a plataforma mapeia:
- **Personalidade e Estilo de Aprendizado:** Como a pessoa absorve melhor o conteúdo (exemplos práticos, leitura direta, desafios, passo a passo detalhado, tom mais direto ou mais encorajador);
- **Rotina e Disponibilidade Real:** Como funciona a semana do usuário, em quais dias ele trabalha ou estuda, quais horários são livres de verdade e em quais momentos do dia ele tem mais energia e foco.

### 3. O Plano de Aprendizado com Objetivo Claro
A partir do cruzamento entre o tema, o nível atual e a rotina do usuário, o Glint constrói um **Plano de Aprendizado completo e sob medida**.
- **Objetivo Claro:** O plano não é uma lista vaga de tópicos; ele tem um ponto de chegada bem definido para que o usuário saiba exatamente o que será capaz de fazer quando terminar.
- **Horizonte de Várias Semanas:** Dependendo da complexidade do tema e do tempo disponível na rotina do usuário, o plano se desdobra ao longo de várias semanas, dividido em etapas progressivas que constroem o conhecimento tijolo por tijolo, sem sobrecarregar nem deixar lacunas.

### 4. Calendário Prático do Dia a Dia
Um bom plano só funciona quando encontra a agenda real. Por isso, o Glint transforma o plano de semanas em um **calendário prático e visual**.
- O usuário vê exatamente **quais dias da semana** e **em quais horários** vai estudar;
- Cada bloco no calendário já traz **o que precisa ser feito naquela sessão específica**, eliminando a indecisão de sentar para estudar e não saber por onde começar;
- Se a rotina mudar ou um imprevisto acontecer, o calendário e o plano se adaptam para manter o objetivo vivo.

### 5. Avisos e Notificações Personalizadas
Como o Glint conhece a personalidade do usuário, seus horários livres e o que está planejado para cada dia, ele não envia notificações genéricas e robóticas que acabam sendo ignoradas.
- Os **avisos e lembretes são personalizados** para o jeito da pessoa e disparados exatamente nos horários em que ela realmente pode agir;
- As mensagens levam em conta o contexto do momento (qual tarefa está prevista para hoje, como foi o progresso nos últimos dias e qual abordagem funciona melhor para motivar aquele perfil específico de usuário).

---

## Identidade Visual, Logo e Animações (`steering/DESIGN.md` & `steering/ANIMATIONS.md`)

As especificações detalhadas de interface, marca e movimento ficam documentadas em [`steering/DESIGN.md`](./steering/DESIGN.md) e [`steering/ANIMATIONS.md`](./steering/ANIMATIONS.md):
- **Diretrizes Principais de UI/UX (Anti-Template / Regra de Ouro):**
  - **Ponto Focal Único:** O centro gravitacional é a Sessão de Hoje, o Calendário ou o Mentor — nunca fileiras genéricas de cards de KPIs (*número grande + label pequeno*).
  - **Higiene Tipográfica:** Textos de leitura `< 75ch–80ch`; proibido pintar/italizar palavras soltas em títulos sem função semântica, abusar de `ALL CAPS` ou colocar *eyebrow badges* acima de todo título.
  - **Superfícies com Propósito:** Construir hierarquia contrastando as superfícies da paleta (`#FFFDF8`, `#F3EFE6`, `#E8F0FE`, `#FFF0E5`, `#FFFFFF`) em vez de empilhar cards idênticos com sombras cinzas; bordas e cores sempre codificam estado real.
  - **Movimento e Interatividade Intencionais:** Todo elemento clicável (botões, links, toggles, controles interativos) deve obrigatoriamente usar `cursor-pointer`; sem *fade-and-slide* repetitivo em listas/cards; animações restritas a feedbacks de ação e às expressões da Abelhinha (`steering/ANIMATIONS.md`).
- **Estética Geral:** Clara, acolhedora e baseada em tons pastéis vibrantes e solares (zero neon).
- **Chips do cabeçalho da trilha (`plan-trail.tsx`):** Horas semanais, horários e critérios de sucesso usam pills com fundo Areia Suave, sem borda ou sombra, texto de peso médio, altura de 32px e espaçamento uniforme. Lavanda Gelo destaca hover e expansão; horários expandidos usam Areia Suave mais tênue.
- **Paleta Oficial — Aquarela Viva:**
  - **Cobalto Pastel (`#5B8DEF`):** Cor primária, anel superior do `g`, haste do `i`, estado ativo no calendário e progresso da jornada;
  - **Pêssego Coral (`#FF9B85`):** Botão de ação principal (CTA da sessão do dia), trilha pontilhada inferior do `g`, estrela do `i`, corte do `t` e destaques do mentor;
  - **Manteiga Solar (`#FFE07D`):** Brilho (*glint*), corpo da abelhinha, faísca inicial do `g`, badges e tags de tempo;
  - **Pistache Claro (`#95E1B0`):** Asas da abelhinha, etapas e sessões concluídas;
  - **Nuvem Quente (`#FFFDF8`) e Ardósia Escura (`#2D3142`):** Fundo principal aconchegante e tipografia de alto contraste.
- **Logo Oficial (`Trilha de Voo em "g"` + `lint` Geométrico Bicolor):**
  - A abelhinha de perfil voa a partir de uma estrela `#FFE07D`, desenha a cauda do `g` em rastro pontilhado `#FF9B85` e fecha o anel superior do `g` em linha contínua `#5B8DEF`, pousando no topo direito ao lado do sufixo `lint` em hastes geométricas arredondadas bicolores.
  - Arquivos vetoriais oficiais: [`public/logo.svg`](./public/logo.svg) (logo horizontal), [`public/logo-icon.svg`](./public/logo-icon.svg) (ícone do app) e [`public/mascot-bee.svg`](./public/mascot-bee.svg) (mascote isolada).
- **Tipografia Oficial (`next/font/google`):**
  - **Títulos e Destaques (Display / Editorial):** **`Fraunces`** (`400`, `500`, `600`) — serifada editorial orgânica que dá personalidade autoral aos títulos.
  - **Interface, Calendário e Leitura (Sans):** **`Plus Jakarta Sans`** (`400`, `500`, `600`, `700`, com `tabular-nums` para horários).
- **Ícones e Componentes (HeroUI):**
  - Siga [`steering/DESIGN.md`](./steering/DESIGN.md) para todas as decisões visuais e de interação.
  - **Sempre utilize ícones do ecossistema HeroUI** (`@gravity-ui/icons` / `@heroicons/react`) em toda a interface; nunca crie `<svg>` manuais/improvisados para ícones de UI (SVGs customizados são exclusivos do logo e da mascote Abelhinha).
- **Playbook de Animações (`steering/ANIMATIONS.md`):**
  - Documenta a animação de assinatura (abelhinha voando e desenhando o `g`) e as **6 poses oficiais da abelhinha de perfil**: *1. Perfil Padrão*, *2. Modo Foco (Óculos + Livro)*, *3. Voo Rápido (Streak)*, *4. Comemorando*, *5. Curiosa (`?`)* e *6. Sonolenta (`zZ`)*.

---

## Estrutura do Projeto e Stack Técnica (`steering/SPEC.md`)

A aplicação Next.js (`app/`, `public/`, `prisma/`, `proxy.ts`, `package.json`, `tsconfig.json`, `next.config.ts`) fica diretamente na **raiz do repositório**, e os documentos de especificação e design ficam na pasta `steering/` ([`steering/SPEC.md`](./steering/SPEC.md), [`steering/DESIGN.md`](./steering/DESIGN.md) e [`steering/ANIMATIONS.md`](./steering/ANIMATIONS.md)).
- **Documentação de Features e Tasks (`openspec/`):** O projeto utiliza **OpenSpec** (`openspec/changes/` para features em andamento e `openspec/specs/` como fonte da verdade permanente após arquivamento). Consulte `openspec/` sempre que precisar do contrato detalhado de criação de tasks, tools e requisitos.
- **Especificação Técnica ([`steering/SPEC.md`](./steering/SPEC.md)):** Documenta a stack base oficial (**Next.js 16 + Prisma ORM + Supabase PostgreSQL/Auth**), o **padrão de arquitetura e código** (Server Component wrapper em `page.tsx`, `<Suspense>` para `cookies()`, Client Components filhos, Server Actions em `app/actions/` sem API routes para formulários), variáveis de ambiente e links de referência.
- **Fluxo de Entrada:** `proxy.ts` redireciona `/` diretamente para `/login` (`app/login/page.tsx`). Após o cadastro (`/cadastro`) ou login (`/login`) e persistência no banco via `app/actions/auth.ts`, o usuário é redirecionado para `/primeiro-plano` (`app/primeiro-plano/page.tsx` + `app/primeiro-plano/primeiro-plano-form.tsx`), onde informa o que deseja aprender (`rawInput` / `goal`). Ao enviar, a Server Action `createPlanAction` (`app/actions/plan.ts`) cria o registro `LearningPlan` no banco em `REFINING_GOAL` com JSONs iniciais vazios (`executableMeta: {}`, `planStructure: {}`) e redireciona para `/criacao-plano/[plan-id]` (`app/criacao-plano/[plan-id]/page.tsx` + `criacao-plano-client.tsx`).
- **Componentes de Marca (`app/components/`):** `animated-logo.tsx` (animação de assinatura do voo em `g`, com trajetória unificada por comprimento de arco, máscara progressiva da cauda pontilhada e amortecimento exponencial de rotação/pouso), `mascot-bee.tsx` (poses oficiais da Abelhinha de Perfil) e `bee-loader.tsx` + `app/loading.tsx` (animação de loading da abelhinha em voo contínuo emitindo onda física em `#5B8DEF` e rastro pontilhado `#FF9B85`) e `honeycomb-loader.tsx` (loader da criação do plano: abelhinha em órbita enchendo de mel os favos de uma colmeia, com balão de fala alternando frases por `stage` definidas em `app/api/plan/random-loaders.ts`).
- **Modelagem de Dados (`prisma/schema.prisma`):** Além de `User` (com `knowledgeGraph`, resumo textual acumulado do perfil de aprendizado do aluno), o banco possui `LearningPlan` (com `isFirstPlan`, `complete`, `stage` via `PlanStage`, `rawInput`, `refinedGoal`, `executableMeta` para o [`executable.json`](./executable.json), `planStructure` para o [`plan_structure.json`](./plan_structure.json), `currentStepId` e contadores de progresso), `PlanTask` (tabela relacional de sessões de estudo do plano com esqueleto, agenda/`triggerAt`, ciclo Just-In-Time `enrichmentStatus`/`triggerRunId`/`stepsPlan`/`content` e estado de execução/feedback `status`, `completedSteps`, `difficultyRating`, `userNotes`) e `PlanMessage` (histórico normalizado da conversa por `stage` e `stepId`). **Regra obrigatória de banco:** sempre que alterar `prisma/schema.prisma`, crie e aplique a respectiva migration no Prisma (`prisma/migrations/`, via `npx prisma migrate dev` + `npx prisma generate`) para manter o banco e o cliente sincronizados.
- **Camada de IA Centralizada ([`lib/infra/llm.ts`](./lib/infra/llm.ts)), Agentes de Planejamento (`lib/agents/`) e Step Agents JIT (`lib/step-agents/`):** `lib/infra/llm.ts` configura o provedor OpenRouter (`openrouter`), os IDs oficiais (`MODEL_IDS`: `google/gemini-4-hydrogen`, `openai/gpt-6.1-terra`, `anthropic/claude-haiku-5.5`, `typesafe/jev-1.14`), os modelos pré-instanciados (`models.architect`, `models.fast`, `models.lowCost`, `models.jev` via `evaluationModel`) e o helper `checkWithJev` (avaliações booleanas na Decisions API). Os agentes em `lib/agents/` (`refining-goal.ts`, `meta-plan.ts`, `interviewing-steps.ts`, `generating-tasks.ts`, `prompts.ts` e `types.ts`) atuam como funções puras de domínio (LLM + Jev), enquanto o router determinístico em `app/api/plan/route.ts` e os handlers em `app/api/plan/handlers/` autenticam, traduzem respostas (`QuestionAnswer`), persistem `PlanMessage`/`LearningPlan` e controlam as transições de `stage`. Já os step agents JIT em `lib/step-agents/` (`types.ts`, `blueprint.ts`, `video-agent.ts`, `concept-explainer-agent.ts`, `quiz-and-walkthrough-agent.ts` e `index.ts`) executam o pipeline `Tool → Walkthrough` de cada sessão (`stepsPlan` → YouTube Data API v3 + Supadata + Firecrawl v2 → `active_recall_quiz` + `walkthrough` validados via `TaskContentSchema`).
- **Arquitetura de Criação do Plano ([`steering/SPEC.md`](./steering/SPEC.md#7-arquitetura-de-criação-do-plano), [`executable.json`](./executable.json) e [`plan_structure.json`](./plan_structure.json)):**
  1. **Refinamento do Objetivo:** Recebe a query inicial + `System Prompt Base` + `Knowledge Graph` do `User` (se existir, via [`lib/learner-context.ts`](./lib/learner-context.ts), que também atualiza o resumo por LLM ao final de cada geração de `planStructure`) e itera com validação do **Jev Judge** até extrair um objetivo concreto e executável (`refinedGoal`).
  2. **Meta-Plano ("Plano pro Plano" — [`executable.json`](./executable.json)):** Gera os `steps` investigativos específicos do domínio com `criteriaForJev` vazios e itera sobre eles (com *cross-filling* e avaliação de confiança pelo **Jev Judge**) até preencher todas as lacunas. Na etapa de rotina (`schedule_picker`, [`app/components/ai/question-schedule.tsx`](./app/components/ai/question-schedule.tsx)), o seletor de dias e horários exibe conflitos em vermelho (`#C85A54` sobre `#FDF2F2`) apenas quando o intervalo escolhido (`startTime` + `durationMinutes`) realmente se sobrepõe a `occupiedSlots` de planos ativos, permitindo agendar livremente no mesmo dia em horários sem interseção.
  3. **Esqueleto do Plano e Geração Just-In-Time de Tasks ([`steering/TaskCreation.md`](./steering/TaskCreation.md) e [`plan_structure.json`](./plan_structure.json)):** Compila a lista de `tasks` casadas com os minutos reais de cada dia (`consumeMinutes` + `practiceMinutes`), bloqueadas até a data (`lockState`), onde cada task define suas `requiredTools` dentre as **3 tools oficiais** (`video`, `concept_explainer` via Firecrawl + Markdown completo com Mermaid/tabelas/docs e `active_recall_quiz` com quantidade dinâmica de perguntas decidida pela IA, `correctOptionId` e explicações). A geração também recebe a **agenda ocupada** (`occupiedSlots` de [`lib/occupied-slots.ts`](./lib/occupied-slots.ts), derivada das `PlanTask` de planos `ACTIVE`/`ENRICHING_TASKS`) para não alocar sessões em horários já reservados. No `accept_plan` ([`app/api/plan/handlers/accept-plan.ts`](./app/api/plan/handlers/accept-plan.ts)), uma validação determinística de sobreposição de intervalos rejeita com `409` agendas que conflitem com planos ativos (o client oferece `adjust_plan` com feedback automático), e as linhas são criadas em transação na tabela `PlanTask` com `unlockAt`/`triggerAt` em UTC ([`lib/task-schedule.ts`](./lib/task-schedule.ts)) e os jobs são agendados no **Trigger.dev** via [`lib/trigger-jobs.ts`](./lib/trigger-jobs.ts) (`T-10 min` via `delay` + disparo imediato On-Demand PRO). O motor [`lib/task-reschedule.ts`](./lib/task-reschedule.ts) sincroniza reagendamentos em cascata entre `PlanTask`, `planStructure` e os runs do Trigger.dev, enquanto o worker [`trigger/enrich-plan-task.ts`](./trigger/enrich-plan-task.ts) executa o lock atômico (`PENDING`/`FAILED` → `GENERATING`), roda `runEnrichTaskPipeline` (`stepsPlan` → Tools → `content`) e persiste em `READY` (espelhando em `planStructure`).
- **Plataforma Logada (`app/(platform)/`):** Shell mobile-first (bottom tab bar no mobile + top navbar no desktop via `platform-shell.tsx` e `layout.tsx`) sobre rotas dedicadas (`/home`, `/planos`, `/planos/[planId]`, `/planos/[planId]/replan`, `/planos/[planId]/tasks/[taskId]`, `/conta`). A `/home` traz a **Sessão de Hoje** (`components/next-task-hero.tsx`), a **Faixa Semanal** (`components/week-strip.tsx`), o painel de contexto (`components/context-panel.tsx`) e o fluxo **"Imprevisto hoje?"** (`components/reschedule-modal.tsx`). O fluxo de **Replan Conversacional** (`/planos/[planId]/replan`, acessível pela trilha em `plan-trail.tsx` e pelos 3 pontos em `planos-list.tsx`) utiliza `lib/agents/replan.ts` (triagem `models.fast` + `checkWithJev`, reflow determinístico para `SCHEDULE_ONLY` preservando `content` `READY`, ou `models.architect` para `PARTIAL_REPLAN`/`GOAL_PIVOT`) e `app/api/plan/[planId]/replan/route.ts`, gravando versões confirmadas em `PlanReplan` (`oldPlan`, `newPlan`) e reconciliando `PlanTask`, `planStructure` e Trigger.dev em transação atômica. A rota da sessão (`app/(platform)/planos/[planId]/tasks/[taskId]/page.tsx` + `task-session-client.tsx`) oculta a navbar global do `platform-shell.tsx` para operar como um **Split-Workspace imersivo estilo LeetCode** (`h-dvh overflow-hidden`): barra superior de controle com `StepTrail` e botão de **Modo Tela Cheia**, **coluna esquerda redimensionável** (`24%–62%`) dedicada aos **Assets & Bee IA** (com abas `Metas & Roteiro`, `Bee IA` e modo `Dividir` para exibir Objetivo + Entrega + Roteiro guiado empilhados com o chat da Bee simultaneamente) e **coluna direita ampla** dedicada ao palco do conteúdo (`StepStage`: `VideoToolPlayer`, `ConceptExplainer`, `RecallQuiz`, com botão `Focar conteúdo`), além de persistir progresso/conclusão/feedback (`recordStepProgressAction`, `finishTaskSessionAction`) e oferecer preparação sob demanda direta (`enrichTaskNowAction` → [`lib/enrich-plan-task.ts`](./lib/enrich-plan-task.ts), liberada temporariamente para FREE e PRO enquanto os deploys do Trigger.dev Cloud aguardam liberação). A especificação e implementação do assistente contextual efêmero da sessão (**Bee Helper**, integrado diretamente na coluna esquerda do workspace via `bee-helper-panel.tsx` em modo `embedded`, com rota de streaming `app/api/plan/[planId]/tasks/[taskId]/bee/route.ts` usando `models.lowCost` com contexto Plano → Task → Step, guarda socrática no quiz e busca web via `lib/infra/firecrawl.ts`) estão documentadas no OpenSpec em [`openspec/specs/bee-helper/spec.md`](./openspec/specs/bee-helper/spec.md) e [`openspec/changes/bee-helper-session-assistant/design.md`](./openspec/changes/bee-helper-session-assistant/design.md). Consistência por **ritmo semanal**, presença pontual da Abelhinha e persistência via Server Actions sobre `LearningPlan.planStructure` / `PlanTask`.

---

## Regras de Branch e Fluxo Git (`development` / `main`)

- **Sempre verificar atualização antes de editar:** Antes de alterar qualquer código, execute `git pull` para garantir que a branch local está *up to date*.
- **Se estiver na branch `development`:**
  - **Nunca sobrescrever código:** Se ocorrer qualquer conflito, **não faça nada** (não resolva forçando nem sobrescreva alterações) e pare imediatamente.
  - **Merge proibido:** É proibido fazer merge direto na ou a partir da branch `development`.
  - **Pull Request apenas com feature pronta:** Só crie um Pull Request quando a feature estiver 100% pronta. Enquanto estiver em andamento, **não** crie PR.
  - **Deploy na Vercel:** A branch `development` possui deploy automático na Vercel com sua própria URL de preview: `https://glint-git-development-bernardo-moreira-lopes-sousas-projects.vercel.app/`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
