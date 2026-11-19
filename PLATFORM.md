# Glint — Plano da Plataforma (v1)

> Especificação arquitetural e de interface da plataforma logada do **Glint**, alinhada com [`AGENTS.md`](./AGENTS.md), [`steering/DESIGN.md`](./steering/DESIGN.md), [`steering/ANIMATIONS.md`](./steering/ANIMATIONS.md) e [`steering/SPEC.md`](./steering/SPEC.md).

---

## 1. Princípios de Produto & UI

- **Mobile-first com experiência desktop autoral:** Pensado para execução rápida no celular (bottom tab bar fixa), mas escalando no desktop com top navbar limpa e grid editorial assimétrico — nunca um clone esticado de mobile nem um dashboard genérico de KPIs.
- **Tempo real como eixo central:** Diferente de apps baseados em trilhas abstratas, o ponto focal da `/home` é **a próxima sessão agendada no tempo real** + a **faixa da semana**, refletindo o contrato de rotina real do usuário.
- **Execução sem atrito dentro de `/home`:** A sessão de estudo acontece em **Modo Foco** dentro da própria `/home`, carregando dados no servidor via credenciais em cookies (`Server Components` + `<Suspense>`).
- **Consistência sem punição:** Ritmo semanal (*"2 de 3 sessões esta semana"*) no lugar de streak diário punitivo — respeitando os dias de descanso do `routineContract`.
- **Abelhinha com presença pontual e expressiva:** Ligada a estados reais (*Modo Foco*, *Sonolenta*, *Comemorando*, *Curiosa*) e loaders; sem poluir cada bloco da tela.
- **Higiene visual (`steering/DESIGN.md`):** Paleta *Aquarela Viva* (`#FFFDF8`, `#F3EFE6`, `#E8F0FE`, `#FFF0E5`, `#5B8DEF`, `#FF9B85`, `#FFE07D`, `#95E1B0`), tipografia `Fraunces` + `Plus Jakarta Sans` (`tabular-nums`), ícones exclusivamente do ecossistema HeroUI (`@gravity-ui/icons` / `@heroicons/react`) e `cursor-pointer` em todo elemento clicável.

---

## 2. Arquitetura de Rotas & Shell

Usar um Route Group `(platform)` para compartilhar o shell de navegação e a proteção de sessão (validação de cookies no servidor) entre as telas logadas, sem afetar `/login`, `/cadastro`, `/primeiro-plano` e `/criacao-plano/[plan-id]`.

```text
app/
├── (platform)/
│   ├── layout.tsx                  # Shell persistente (Top Navbar desktop + Bottom Bar mobile)
│   ├── home/
│   │   ├── page.tsx                # Server Component (<Suspense>, lê cookies e carrega planos)
│   │   ├── home-client.tsx         # Orquestra visão padrão da Home <-> Modo Foco
│   │   ├── next-task-hero.tsx      # Hero da próxima task + estados (hoje / futura / empty)
│   │   ├── week-strip.tsx          # Faixa semanal de 7 dias
│   │   ├── context-panel.tsx       # Painel lateral desktop (ritmo, progresso, mentor, imprevisto)
│   │   ├── focus-session.tsx       # Modo Foco em tela cheia (vídeo + checklist + conclusão)
│   │   └── reschedule-modal.tsx    # Sheet/Modal "Imprevisto hoje?"
│   ├── planos/
│   │   ├── page.tsx                # Server Component: lista de todos os planos do usuário
│   │   ├── planos-list.tsx         # Linhas largas de planos + CTA "+ Novo plano"
│   │   └── [planId]/
│   │       ├── page.tsx            # Server Component: detalhe de um plano específico
│   │       └── plan-trail.tsx      # Objetivo, critérios de sucesso e trilha por semanas
│   └── conta/
│       ├── page.tsx                # Server Component: dados do usuário e rotina coletada
│       └── conta-client.tsx        # Perfil, timezone, badge FREE/PRO, rotina e logout
└── actions/
    ├── session.ts                  # toggleStepAction, completeSessionAction, rescheduleTodayAction
    └── account.ts                  # updateProfileAction (nome, timezone)
```

### Navegação (3 itens)
| Item | Rota | Ícone (HeroUI) | Comportamento |
|---|---|---|---|
| **Início** | `/home` | Home / Play | Ponto focal: próxima task, faixa semanal e Modo Foco |
| **Planos** | `/planos` | Map / Layers | Lista de planos (ativos, em criação, concluídos) e trilha detalhada |
| **Conta** | `/conta` | Person | Perfil, assinatura, fuso horário, rotina e logout |

- **Mobile (`< md`):** Bottom tab bar fixa (`bg-[#FFFDF8]/95 backdrop-blur border-t border-[#F3EFE6]`), altura confortável com safe-area. Item ativo em `#5B8DEF` sobre pílula `#E8F0FE`.
- **Desktop (`>= md`):** Top navbar limpa (`max-w-[1120px] mx-auto`), logo oficial do Glint à esquerda, 3 links de navegação centralizados/alinhados e indicador discreto de conta à direita.
- **Modo Foco ativo na `/home`:** O shell esconde a Top Navbar e a Bottom Bar (ou o `FocusSession` assume camada em tela cheia `fixed inset-0 z-50 bg-[#FFFDF8]`), exibindo apenas uma barra superior minimalista com botão **"Sair da sessão"** e título/progresso da task.

---

## 3. Especificação das Telas

### 3.1. Início (`/home`)

#### Regras de Seleção de Dados (Server-side)
1. Autentica o usuário via cookies (se inválido, redireciona para `/login`).
2. Busca os `LearningPlan` do usuário.
3. Identifica:
   - **Planos em criação** (`stage` em `REFINING_GOAL`, `INTERVIEWING_STEPS`, `GENERATING_TASKS`, `ENRICHING_TASKS`): exibe banner discreto no topo (*"Você tem um plano esperando sua entrevista — Continuar"* → `/criacao-plano/[id]`).
   - **Próxima task única (multi-plano):** Entre todos os planos `ACTIVE`, seleciona a primeira task não concluída (`status !== "completed"`) com a data/hora (`schedule.date` + `schedule.startTime`) mais próxima no tempo. O objetivo/nome do plano aparece como metadado sutil dentro do Hero.
   - **Empty State:** Se não houver nenhum plano `ACTIVE` (nem em criação), exibe a Abelhinha na pose **Curiosa**, título em `Fraunces` (*"O que você quer aprender agora?"*) e CTA coral para `/primeiro-plano`.

#### Layout Responsivo
- **Mobile:** Coluna única com respiro (`px-4 pb-24 pt-5`), na ordem:
  1. Banner de plano em criação (condicional)
  2. **Faixa Semanal (7 dias)**
  3. **Hero da Próxima Task**
  4. **Resumo de contexto** (ritmo da semana + progresso do plano + link *"Imprevisto hoje?"*)
- **Desktop:** Grid assimétrico centralizado (`max-w-[1120px] mx-auto grid-cols-[minmax(0,1fr)_340px] gap-8`):
  - **Coluna Esquerda (~65%):** Banner (condicional) → **Faixa Semanal (7 dias)** → **Hero da Próxima Task**.
  - **Coluna Direita (~35%):** **Painel de Contexto** (superfície `#F3EFE6`/`#FFF0E5`, sem cara de card de KPI):
    - Ritmo semanal: *"2 de 3 sessões esta semana"* com marcadores visuais em `#95E1B0` / `#5B8DEF`.
    - Progresso do plano da próxima task: barra fina (`completedTasks / totalTasks`) + semana atual.
    - **Recado do Mentor:** frase curta contextual acompanhada da Abelhinha na pose do momento.
    - Ação secundária discreta: **"Imprevisto hoje?"** (só aparece quando há sessão desbloqueada hoje).

#### Estados do Hero da Próxima Task
| Estado | Condição | Visual & Superfície | Pose da Abelhinha | CTA Principal |
|---|---|---|---|---|
| **Sessão de hoje (pronta)** | `date <= hoje`, `!lockState.isLocked`, `enrichmentStatus === "completed"` | Superfície `#FFF0E5` / `#FFFFFF` com borda `#5B8DEF`/25; horário (`tabular-nums`), `consumeMinutes + practiceMinutes`, título em `Fraunces`, `whyItMatters` e badges de `requiredTools` | **Modo Foco** | Botão coral (`#FF9B85`) **"Começar sessão"** |
| **Preparando conteúdo** | `date <= hoje`, `enrichmentStatus !== "completed"` | Mesmo layout com aviso suave de preparo em background | **Curiosa** | Botão desabilitado *"Preparando sua sessão..."* |
| **Próxima sessão futura (bloqueada)** | `date > hoje` ou `lockState.isLocked` | Superfície `#F3EFE6`; mostra título, data/hora de desbloqueio (`unlockAt`) e `whyItMatters` (bloqueio suave, sem furar fila) | **Sonolenta** | Sem CTA coral; mostra *"Desbloqueia [dia] às [hora]"* |
| **Sessão de hoje concluída** | Todas as tasks de hoje concluídas e próxima é futura | Mensagem de reforço em `#95E1B0`/20 + prévia discreta da próxima sessão | **Comemorando** | Link discreto para ver o plano |

#### Faixa Semanal (7 dias)
- Exibe os 7 dias da semana corrente (Seg → Dom) com o dia atual destacado em `#5B8DEF` sobre `#E8F0FE`.
- Cada dia que possui sessão agendada (considerando todos os planos ativos) mostra um bloco/indicador codificado por cor:
  - **Concluída:** `#95E1B0` (Pistache)
  - **Hoje / Ativa:** `#5B8DEF` (Cobalto)
  - **Futura / Bloqueada:** `#F3EFE6` com borda sutil (Ardósia Suave)
- Tocar/clicar em um dia com sessão exibe um resumo compacto abaixo da faixa (plano, título, horário e status).

---

### 3.2. Modo Foco (Execução da Sessão dentro de `/home`)

Ativado ao clicar em **"Começar sessão"** na `/home` (estado client-side em `home-client.tsx`, sem mudar de rota).

#### Estrutura (v1)
- **Header minimalista:** Botão **"Sair da sessão"** (esquerda), nome do plano + progresso da checklist (`2/3 passos`) em `tabular-nums` (direita).
- **Conteúdo:**
  - **Bloco de contexto:** Título em `Fraunces`, `whyItMatters` e divisão de tempo (`15 min consumo · 30 min prática`).
  - **Player de Vídeo (`content.video`):** `iframe` do YouTube já configurado com `start={watchStartSeconds}&end={watchEndSeconds}` + resumo colapsável (`transcriptSummary`) com largura de leitura `< 75ch`.
  - **Checklist Prática (`content.steps`):** Lista interativa de passos. Cada toggle chama `toggleStepAction` com atualização otimista (`useOptimistic`) para salvar progresso imediatamente.
  - **No Desktop:** Layout 2 colunas confortáveis (vídeo + resumo à esquerda; checklist prática e conclusão à direita) quando houver vídeo, ou coluna centrada (`max-w-[720px]`) se for apenas prática.
- **Conclusão da Sessão:**
  - Botão coral **"Concluir sessão"** (habilitado quando o usuário desejar, com destaque especial quando todos os passos estão marcados).
  - Ao clicar, exibe etapa rápida de feedback (**"Como foi essa sessão?"**: `Foi fácil` | `Na medida` | `Puxado`) → chama `completeSessionAction`.
  - Mostra tela breve de celebração com a Abelhinha **Comemorando** e botão **"Voltar ao Início"** (atualizando a `/home` via `revalidatePath("/home")`).

---

### 3.3. Reagendamento ("Imprevisto hoje?")

- Acionado pelo link **"Imprevisto hoje?"** na `/home` (quando há uma task agendada para hoje não concluída).
- Abre modal (desktop) / bottom sheet (mobile) explicando claramente o que vai acontecer:
  - Calcula o próximo slot livre do `routineContract` do plano.
  - Mostra prévia: *"Mover esta sessão de hoje para [Quinta, 19/11 às 20:00] e ajustar as próximas datas do plano."*
- Ao confirmar, executa `rescheduleTodayAction`, recalculando `schedule.date`, `schedule.dayOfWeek`, `schedule.startTime` e `lockState.unlockAt` das tasks não concluídas daquele plano a partir do próximo slot.

---

### 3.4. Planos (`/planos` e `/planos/[planId]`)

#### Lista de Planos (`/planos`)
- Cabeçalho limpo com título `Planos` (`Fraunces`) e botão coral/primário **"+ Novo plano"** (leva para `/primeiro-plano`).
- Lista em **linhas largas** (sem grid de cards quadrados iguais), separadas por seções quando necessário (*Ativos*, *Em criação*, *Concluídos*):
  - Objetivo refinado (`refinedGoal` ou `rawInput`) em `Fraunces`.
  - Barra fina de progresso (`completedTasks / totalTasks`) + próxima data agendada (`tabular-nums`).
  - Planos em criação (`REFINING_GOAL`, `INTERVIEWING_STEPS`, etc.) mostram badge de estágio e CTA **"Continuar entrevista"** → `/criacao-plano/[id]`.
  - Clique em plano ativo/concluído navega para `/planos/[planId]`.

#### Detalhe do Plano (`/planos/[planId]`)
- **Topo editorial:**
  - Link voltar para `/planos`.
  - Objetivo claro (`objective.clearGoal` em `Fraunces`).
  - Lista limpa dos **Critérios de Sucesso** (`objective.successCriteria`).
  - Resumo da rotina (`routineContract.weeklyHours`h/semana · dias e horários).
- **Trilha Vertical por Semanas:**
  - Agrupa `tasks[]` em **Semana 1, Semana 2, ...** com base nas datas (`schedule.date`).
  - Linha conectora vertical ligando os nós de cada sessão:
    - **Concluída:** Nó em `#95E1B0` com check, data e título.
    - **Atual / Desbloqueada:** Nó destacado em `#5B8DEF`, superfície `#E8F0FE`/50, duração e link/botão **"Ir para sessão"** → `/home`.
    - **Futura / Bloqueada (`lockState.isLocked`):** Nó neutro em `#F3EFE6` com ícone de cadeado, data de desbloqueio, título e `whyItMatters` visíveis (bloqueio suave).

---

### 3.5. Conta (`/conta`)

Escopo realista v1, estruturado em blocos limpos sobre `#FFFDF8` / `#F3EFE6`:
1. **Perfil:** Avatar/iniciais, nome (editável), e-mail (somente leitura) e fuso horário (`timezone` editável, padrão `America/Sao_Paulo`) com `updateProfileAction`.
2. **Assinatura:** Exibe o plano atual do banco (`User.plan`: `FREE` ou `PRO`) e `planExpiresAt` se aplicável.
3. **Sua Rotina & Estudo:** Exibe os horários de rotina coletados dos planos ativos (`routineContract.slots`), dando visibilidade ao que o Glint sabe sobre a agenda do usuário.
4. **Sessão:** Botão **"Sair da conta"** (reaproveitando a Server Action de logout).

---

## 4. Contrato de Dados & Persistência (v1)

Na v1, **não há migração de novas tabelas** no Prisma: `LearningPlan.planStructure` (`Json`) continua sendo a fonte única das tasks, estendido com campos opcionais de execução por task:

```ts
export type TaskStatus = "pending" | "in_progress" | "completed";
export type DifficultyFeedback = "easy" | "just_right" | "hard";

export interface PlanTaskExecution {
  status?: TaskStatus;                // default: "pending"
  completedSteps?: number[];          // índices marcados de content.steps[]
  completedAt?: string | null;        // ISO timestamp
  difficultyFeedback?: DifficultyFeedback | null;
}
```

### Server Actions (`app/actions/session.ts`)
Todas validam o usuário autenticado via cookies e verificam propriedade (`plan.userId === user.id`) antes de gravar:

1. `toggleStepAction({ planId, taskId, stepIndex })`
   - Atualiza `completedSteps` na task dentro de `planStructure` e muda `status` para `"in_progress"` se ainda estiver `"pending"`.
2. `completeSessionAction({ planId, taskId, feedback })`
   - Marca `status = "completed"`, grava `completedAt` e `difficultyFeedback`.
   - Recalcula `LearningPlan.completedTasks`; se `completedTasks >= totalTasks`, atualiza `LearningPlan.stage = "COMPLETED"`.
   - Atualiza `User.lastActiveAt`.
   - Chama `revalidatePath("/home")` e `revalidatePath("/planos")`.
3. `rescheduleTodayAction({ planId, taskId })`
   - Empurra a task indicada e todas as tasks futuras não concluídas do mesmo plano para os próximos slots disponíveis do `routineContract`.
   - Atualiza `schedule.date`, `schedule.dayOfWeek`, `schedule.startTime` e `lockState.unlockAt` (recalculando `isLocked`).
   - Chama `revalidatePath("/home")` e `revalidatePath("/planos")`.

---

## 5. Roadmap de Implementação

### Fase 1 — Fundação & Shell
- Criar helpers de tipos e leitura segura de `planStructure` (`lib/plan-structure.ts`: parsing tipado, seleção da próxima task multi-plano, cálculo da faixa semanal e ritmo semanal).
- Criar `app/(platform)/layout.tsx` com Top Navbar (desktop) + Bottom Tab Bar (mobile) e validação de autenticação via cookies.
- Atualizar `proxy.ts` / redirects de login para apontar usuários com planos ativos para `/home`.

### Fase 2 — `/home` + Modo Foco + Server Actions
- Implementar `app/actions/session.ts` (`toggleStepAction`, `completeSessionAction`, `rescheduleTodayAction`).
- Construir `/home` (`page.tsx` com `<Suspense>`, `home-client.tsx`, `next-task-hero.tsx`, `week-strip.tsx`, `context-panel.tsx`, `reschedule-modal.tsx`).
- Construir `focus-session.tsx` (player YouTube com `start`/`end`, checklist otimista, fluxo de feedback e celebração com Abelhinha).

### Fase 3 — `/planos` & `/planos/[planId]`
- Implementar lista de planos em linhas largas (`/planos`) com suporte a planos ativos, em criação e concluídos.
- Implementar detalhe do plano (`/planos/[planId]`) com objetivo, critérios de sucesso e trilha vertical por semanas.

### Fase 4 — `/conta` & Polimento
- Implementar `/conta` + `app/actions/account.ts` (perfil, timezone, badge `FREE`/`PRO`, visualização da rotina e logout).
- Revisão final mobile (375px) + desktop (1440px), verificação de `cursor-pointer`, contraste, `tabular-nums`, poses da Abelhinha e `npm run build`.

### Escopo reservado para v2
- Ferramentas avançadas no Modo Foco: `code_sandbox`, renderização `markdown_math` interativa e drawer "Tirar dúvida com o Glint".
- Editor completo de rotina semanal e "o que o Glint sabe sobre você" em `/conta` disparando replanejamento inteligente.
- Notificações personalizadas (push / e-mail / WhatsApp) e billing Stripe (`PRO`).
- Extração opcional de `tasks[]` para tabela relacional `PlanTask` se a escala de queries multi-plano exigir.
