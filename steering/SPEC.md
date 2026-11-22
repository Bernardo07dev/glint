# Glint — Especificação Técnica (`SPEC.md`)

> **Status:** Stack Base Definida (Core Web, Banco de Dados e ORM)  
> *Camadas de IA, Orquestração e Memória serão adicionadas conforme validação.*

---

## 1. Visão Geral da Stack Base

A arquitetura fundacional do **Glint** utiliza uma stack full-stack TypeScript moderna centrada em **Next.js**, **Prisma** e **Supabase**:

| Camada | Tecnologia | Papel no Projeto |
| :--- | :--- | :--- |
| **Framework Full-Stack** | **Next.js 16 (`16.4.6`, App Router + TypeScript)** | Renderização híbrida (Server/Client Components), Route Handlers (`app/api/`), Server Actions e roteamento via `proxy.ts`. |
| **Banco de Dados & BaaS** | **Supabase (`@supabase/supabase-js` `2.119.0`, `@supabase/ssr` `0.12.7`)** | Banco de dados PostgreSQL gerenciado, Autenticação SSR, Storage e Row Level Security (RLS). |
| **ORM & Migrations** | **Prisma ORM 7 (`prisma` / `@prisma/client` `7.10.1`)** | Modelagem declarativa do banco (`prisma/schema.prisma`), configuração de datasource em `prisma.config.ts`, tipagem estática e migrações SQL. |
| **UI & Estilização** | **HeroUI v3 (`3.2.7`) + Tailwind CSS v4 (`4.3.3`)** | Componentes acessíveis (`@heroui/react`, `@heroui/styles`), ícones `@gravity-ui/icons` e tokens visuais de `DESIGN.md`. |

---

## 2. Como Prisma e Supabase Operam Juntos no Next.js

1. **Modelagem e Tipagem (`Prisma 7`):**
   - Toda a estrutura relacional da aplicação é declarada em [`prisma/schema.prisma`](./prisma/schema.prisma) (apenas `provider = "postgresql"`, sem `url`/`directUrl` no schema).
   - A URL de conexão para CLI/migrations (`DIRECT_URL`) é configurada em [`prisma.config.ts`](./prisma.config.ts) usando `defineConfig` de `prisma/config`.
   - O **Prisma Client** é utilizado exclusivamente no **servidor** (Server Components, Server Actions e Route Handlers em `app/api/`) através de uma instância singleton em `lib/prisma.ts`, garantindo queries fortemente tipadas e evitando exaustão de conexões em ambiente de desenvolvimento (Hot Reload).
2. **Conexão com Connection Pooling (`Supabase Supavisor`):**
   - `DATABASE_URL`: Usa a string de conexão com **Transaction Pooler** do Supabase (porta `6543` com `?pgbouncer=true`) para queries em runtime serverless/edge.
   - `DIRECT_URL`: Usa a conexão direta com o PostgreSQL do Supabase (porta `5432`) exclusivamente para rodar migrações (`npx prisma migrate dev` / `npx prisma db push`).
3. **Autenticação e Cliente Supabase (`@supabase/supabase-js` & `@supabase/ssr`):**
   - O SDK do Supabase gerencia sessão de usuários, cookies SSR no Next.js e recursos nativos da plataforma (Auth, Realtime e Storage), integrando-se às tabelas modeladas pelo Prisma via `user_id`.

---

## 3. Variáveis de Ambiente Necessárias (`.env`)

```env
# Supabase API & Auth
NEXT_PUBLIC_SUPABASE_URL="https://[SEU-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon-publica"

# Prisma + Supabase PostgreSQL Connection
# Transaction Pooler (Porta 6543) — Usado pela aplicação em runtime
DATABASE_URL="postgresql://postgres.[SEU-PROJECT-REF]:[SUA-SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (Porta 5432) — Usado pelo Prisma CLI para Migrations / Introspection
DIRECT_URL="postgresql://postgres.[SEU-PROJECT-REF]:[SUA-SENHA]@aws-0-[REGIAO].pooler.supabase.com:5432/postgres"
```

---

## 4. Documentação de Referência da Stack

### Next.js
- **Documentação Local do Projeto (Next.js 16):** [`node_modules/next/dist/docs/`](./node_modules/next/dist/docs/) *(consulte sempre esta pasta para APIs e convenções da versão instalada)*
- **Documentação Oficial Web:** [https://nextjs.org/docs](https://nextjs.org/docs)
- **App Router & Route Handlers:** [https://nextjs.org/docs/app](https://nextjs.org/docs/app)

### Prisma ORM 7 (`7.10.1`)
- **Documentação Oficial do Prisma:** [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **Configuração de Datasource no Prisma 7 (`prisma.config.ts`):** [https://pris.ly/d/config-datasource](https://pris.ly/d/config-datasource)
- **Guia Oficial Prisma + Supabase:** [https://www.prisma.io/docs/orm/overview/databases/supabase](https://www.prisma.io/docs/orm/overview/databases/supabase)
- **Guia Oficial Prisma + Next.js (Singleton Best Practices):** [https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices)
- **Referência do `schema.prisma`:** [https://www.prisma.io/docs/orm/reference/prisma-schema-reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference)

### Supabase
- **Documentação Oficial do Supabase:** [https://supabase.com/docs](https://supabase.com/docs)
- **Guia Oficial Supabase + Prisma:** [https://supabase.com/docs/guides/database/prisma](https://supabase.com/docs/guides/database/prisma)
- **Supabase Auth com Next.js App Router (`@supabase/ssr`):** [https://supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- **JavaScript Client (`@supabase/supabase-js`):** [https://supabase.com/docs/reference/javascript/introduction](https://supabase.com/docs/reference/javascript/introduction)

---

## 5. Comandos Úteis do Dia a Dia

```bash
# Gerar o cliente TypeScript do Prisma após alterar prisma/schema.prisma
npx prisma generate

# Sincronizar o schema rapidamente durante prototipagem (sem criar histórico de migration)
npx prisma db push

# Criar e aplicar uma nova migration versionada
npx prisma migrate dev --name nome_da_mudanca

# Abrir o Prisma Studio para visualizar e editar os dados localmente
npx prisma studio
```

---

## 6. Padrão de Arquitetura e Código (Next.js App Router)

1. **Server Component Wrapper (`page.tsx`):**
   - Toda rota (`app/<rota>/page.tsx`) deve ser um **Server Component** por padrão.
   - Quando a página precisar ler sessão/cookies (`createClient()` de `lib/supabase/server.ts`), envolva o subcomponente `async` em `<Suspense>` para não bloquear o prerender estático da rota.
   - Passe dados iniciais e Server Actions via props para os Client Components filhos.
2. **Client Components (`*-form.tsx`, componentes interativos):**
   - Use `"use client"` apenas nos componentes que realmente precisam de estado, eventos ou hooks (`useState`, `useActionState`).
3. **Server Actions (`app/actions/`):**
   - Mutações e formulários usam **Server Actions** (`"use server"`) diretamente — **não** crie API routes (`app/api/*`) para fluxos de formulário.
   - Estilo direto e legível: `(prevState: any, formData: FormData)`, validação clara com `if`, `try/catch` e retorno padronizado `{ success: true/false, error?, message? }`.
4. **Autenticação JWT + Prisma:**
   - **`lib/auth.ts` (`jose`):** assina e verifica o JWT (`encrypt` / `decrypt`) salvo no cookie HTTP-only `glint-session` usando `JWT_SECRET`.
   - **`app/actions/auth.ts` (`bcryptjs` + `Prisma`):** faz hash de senha com `bcryptjs` e salva tudo diretamente na tabela `User` do Prisma (`lib/prisma.ts`).
5. **Agentes de IA (`lib/agents/`):**
   - Os agentes responsáveis pelas etapas do plano ficam organizados em `lib/agents/`, consumindo a camada centralizada de modelos em `lib/llm.ts` e sendo orquestrados pelo router determinístico em `app/api/plan/route.ts`.

---

## 7. Arquitetura de Criação do Plano

Contratos de referência: [`executable.json`](../executable.json) (Meta-Plano) e [`plan_structure.json`](../plan_structure.json) (Plano Final).

### 7.1. Fluxo de Entrada (`/primeiro-plano` → `/criacao-plano/[plan-id]`)
- Em `/primeiro-plano` (`app/primeiro-plano/primeiro-plano-form.tsx`), o usuário envia seu desejo inicial (`rawInput`).
- A Server Action `createPlanAction` (`app/actions/plan.ts`) valida a sessão JWT (`glint-session`), cria o registro `LearningPlan` no Postgres em `stage: "REFINING_GOAL"` com `executableMeta: {}` e `planStructure: {}` (além de `isFirstPlan`), e redireciona para `/criacao-plano/[plan-id]` (`app/criacao-plano/[plan-id]/page.tsx` + `criacao-plano-client.tsx`).

### 7.2. Camada de Modelos (`lib/llm.ts`) e Stack de IA
Toda a orquestração roda via **OpenRouter** (`@openrouter/ai-sdk-provider`) e **Vercel AI SDK v7** (`generateText` + `Output.object` com schemas Zod em `lib/agents/types/`):
- **`models.architect` (`google/gemini-4-hydrogen`):** Estruturação pedagógica de alta complexidade — gera o Meta-Plano (Etapa 2) e compila o esqueleto final do plano (Etapa 4).
- **`models.fast` (`openai/gpt-6.1-terra`):** Diálogo rápido, extração de respostas e consolidação de objetivo (Etapas 1 e 3).
- **`models.jev` / `checkWithJev` (`typesafe/jev-1.14`):** Modelo de decisão booleana na Decisions API (`threshold: 0.70`) que atua como gatekeeper determinístico da clareza do objetivo e da conclusão de cada step.

### 7.3. Orquestração Determinística (`POST /api/plan`)
- **`app/api/plan/route.ts`:** Autentica o usuário via `glint-session`, valida o payload (`PlanApiRequestSchema`), carrega `LearningPlan` + `PlanMessage`s e delega por `plan.stage` (sem usar LLM para roteamento) para os handlers em `app/api/plan/handlers/`.
- **Handlers (`app/api/plan/handlers/`):** Cuidam da persistência de `PlanMessage` e `LearningPlan` no Prisma e da idempotência em recarregamentos de página, mantendo os agentes em `lib/agents/` como funções puras de IA.

### 7.4. Etapas da Criação do Plano
1. **Etapa 1 — `REFINING_GOAL` (`lib/agents/refining-goal.ts` + `handlers/refining-goal.ts`):**
   - Avalia no Jev se `rawInput` + histórico já expressam um resultado concreto e executável.
   - Enquanto vago (até `MAX_REFINING_TURNS = 2`), gera uma única pergunta (`single_choice` com `allowCustom: true` ou `text`).
   - Quando aprovado, consolida `refinedGoal`, avança `stage` para `INTERVIEWING_STEPS` e já encadeia a Etapa 2 e a primeira pergunta da Etapa 3 na mesma requisição.
2. **Etapa 2 — Meta-Plano (`lib/agents/meta-plan.ts` + `handlers/meta-plan.ts`):**
   - Gera de 3 a 5 `steps` investigativos específicos do domínio no formato `executable.json` (incluindo obrigatoriamente `routine_and_slots`) com `value: null` e `status: "pending"`, salvando em `LearningPlan.executableMeta` e `currentStepId`.
3. **Etapa 3 — `INTERVIEWING_STEPS` (`lib/agents/interviewing-steps.ts` + `handlers/interviewing-steps.ts`):**
   - Faz uma pergunta simples por vez (priorizando `single_choice`/`multi_choice`, e usando `schedule_picker` em `routine_and_slots`), extrai respostas com suporte a *cross-filling*, valida no Jev contra `criteriaForJev` (máximo de 2 tentativas por step) e devolve `stepProgress` para a interface.
   - Quando todos os steps são concluídos, avança `stage` para `GENERATING_TASKS`.
4. **Etapa 4 — `GENERATING_TASKS` (`lib/agents/generating-tasks.ts` + `handlers/generating-tasks.ts`):**
   - Compila o `plan_structure.json` (`successCriteria`, `routineContract` e lista de `tasks` com datas reais, `durationMinutes = consumeMinutes + practiceMinutes`, `lockState` com a 1ª sessão desbloqueada e `requiredTools`), salvando em `LearningPlan.planStructure` e `totalTasks`, e avançando `stage` para `ENRICHING_TASKS`.
   - *(A Etapa 5 — `ENRICHING_TASKS` — enriquecerá o `content` de cada task em background).*

### 7.5. Revisão, Paywall e Aceite (`/criacao-plano/[plan-id]`)
- **UI e Feedback de Progresso:** `QuestionRenderer` (`app/components/ai/`) exibe uma pergunta por vez; `StepFlightTrail` (no canto superior direito do cabeçalho durante `INTERVIEWING_STEPS`) acelera o pulso da estrela até a última pergunta; e `HoneycombLoader` (`app/components/honeycomb-loader.tsx`) exibe a abelhinha em órbita com frases por `stage` de `app/api/plan/random-loaders.ts`.
- **Tela de Plano Pronto (`criacao-plano-client.tsx`):** Exibe os chips de resumo (botão tátil de metas abrindo popup flutuante no canto, semanas e horas/semana), mostra as **3 primeiras sessões** visíveis e o restante sob gradiente bloqueado (*paywall*).
- **Recusar ou Aceitar:**
  - **Recusar e ajustar (`action: "adjust_plan"`):** Pergunta o que melhorar, grava o feedback em `PlanMessage` (`GENERATING_TASKS`) e reexecuta o Agent 4 com o plano anterior + histórico de ajustes.
  - **Aceitar plano (`action: "accept_plan"`):** Promove `LearningPlan.stage` para `ACTIVE` e redireciona para `/home` (`app/home/page.tsx`).

### 7.6. Modelagem de Tasks no Banco (`PlanTask` — Geração Just-In-Time)
Cada sessão de estudo do plano é persistida na tabela relacional `PlanTask` (`prisma/schema.prisma`), separando o esqueleto agendado do conteúdo pedagógico gerado **Just-In-Time** (no dia da task, evitando gasto antecipado de tokens e permitindo adaptar a aula ao feedback da sessão anterior):

- **Identificação e Vínculo:** `id` (UUID), `planId` (FK para `LearningPlan` com `onDelete: Cascade`), `taskKey` (`"task_01"`) e `order` (`1..N`, com `@@unique([planId, order])`).
- **Esqueleto Pedagógico:** `title`, `whyItMatters`, `taskType`, `requiredTools` (`String[]`) e `searchQueryUsed`.
- **Agenda e Tempo:** `scheduledDate` (`"YYYY-MM-DD"`), `dayOfWeek`, `startTime`, `durationMinutes`, `consumeMinutes`, `practiceMinutes` e `unlockAt` (`DateTime`).
- **Ciclo Just-In-Time (JIT):** `enrichmentStatus` (`TaskEnrichmentStatus`: `PENDING`, `GENERATING`, `READY`, `FAILED`), `jevAlignmentScore`, `enrichedAt` e `content` (`Json?` com o payload das tools geradas para a aula, como vídeo recortado, steps do checklist, leitura guiada ou quiz).
- **Execução e Feedback do Aluno:** `status` (`TaskStatus`: `LOCKED`, `AVAILABLE`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`), `completedSteps` (`String[]` com os IDs dos steps concluídos), `completedAt`, `difficultyRating` (`"too_easy" | "just_right" | "too_hard"`) e `userNotes`.
