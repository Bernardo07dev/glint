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
- **Especificação Técnica ([`steering/SPEC.md`](./steering/SPEC.md)):** Documenta a stack base oficial (**Next.js 16 + Prisma ORM + Supabase PostgreSQL/Auth**), o **padrão de arquitetura e código** (Server Component wrapper em `page.tsx`, `<Suspense>` para `cookies()`, Client Components filhos, Server Actions em `app/actions/` sem API routes para formulários), variáveis de ambiente e links de referência.
- **Fluxo de Entrada:** `proxy.ts` redireciona `/` diretamente para `/login` (`app/login/page.tsx`).
- **Componentes de Marca (`app/components/`):** `animated-logo.tsx` (animação de assinatura do voo em `g`, com trajetória unificada por comprimento de arco, máscara progressiva da cauda pontilhada e amortecimento exponencial de rotação/pouso) e `mascot-bee.tsx` (poses oficiais da Abelhinha de Perfil).
- **Arquitetura de Criação do Plano ([`PLAN_CREATION.md`](./PLAN_CREATION.md), [`executable.json`](./executable.json) e [`plan_structure.json`](./plan_structure.json)):**
  1. **Refinamento do Objetivo:** Recebe a query inicial + `System Prompt Base` + `Knowledge Graph` (se existir) e itera com validação do **Jev Judge** até extrair um objetivo concreto e executável (`refinedGoal`).
  2. **Meta-Plano ("Plano pro Plano" — [`executable.json`](./executable.json)):** Gera os `steps` investigativos específicos do domínio com `criteriaForJev` vazios e itera sobre eles (com *cross-filling* e avaliação de confiança pelo **Jev Judge**) até preencher todas as lacunas.
  3. **Esqueleto do Plano e Workers de Task ([`plan_structure.json`](./plan_structure.json)):** Compila a lista direta de `tasks` casadas com os minutos reais de cada dia (`consumeMinutes` + `practiceMinutes`), bloqueadas até a data (`lockState`), onde cada task define suas `requiredTools` (`youtube_video`, `practice_checklist`, `markdown_math`, `code_sandbox`) e é enriquecida isoladamente em background (`for` sobre `tasks` passando apenas `objective` + `routineContract` + `task`).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


