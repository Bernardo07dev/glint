# Plano Steering: Animações Full-Screen & Loaders Dinâmicos com IA (`DYNAMIC_ANIMATIONS.md`)

> Documento de direcionamento (*steering*) que consolida o diagnóstico dos problemas de animação do **Glint**, a especificação visual e o padrão já implementado das cenas **Full-Screen (`100dvh`)** em [`fullscreen-dynamic-animation.tsx`](../app/components/fullscreen-dynamic-animation.tsx) e [`/animations`](../app/animations/page.tsx), e o modelo de **frases dinâmicas geradas por IA** baseadas na situação real do aluno.
> Consulte também [`DESIGN.md`](./DESIGN.md), [`ANIMATIONS.md`](./ANIMATIONS.md) e [`SPEC.md`](./SPEC.md).

---

## 1. Diagnóstico: O Problema Anterior no Glint

Embora o Glint tivesse uma base funcional sólida e uma identidade visual definida (**Aquarela Viva** + **Abelhinha de Perfil**), a experiência visual de entrada, transição e carregamento sofria de três problemas centrais:

1. **Escala Tímida e Sem Impacto ("Abelhinha Pequena + Frasezinha"):**
   - O [`BeeLoader`](../app/components/bee-loader.tsx) renderizava um SVG contido (`w-44 h-22`, ou `w-56 h-28` no tamanho `lg`) isolado no centro de uma tela vazia (`#FFFDF8`), com um rótulo pequeno em `text-lg`.
   - O [`HoneycombLoader`](../app/components/honeycomb-loader.tsx) ficava restrito a um quadrado `w-40 h-40` com um balão de fala compacto (`max-w-[36ch]`, fonte `text-xs` / `text-sm`).
   - Em vez de transmitir um produto vivo, colorido e memorável logo ao abrir no celular ou no computador, a animação parecia apenas um *spinner* comum.

2. **Frases Estáticas, Repetitivas e Desconectadas do Usuário:**
   - O arquivo [`random-loaders.ts`](../app/api/plan/random-loaders.ts) sorteava strings fixas (*"Batendo as asinhas para preparar o próximo passo"*, *"Anotando tudo no meu caderninho de abelha"*).
   - Todo usuário lia exatamente as mesmas frases, independentemente de ser a **primeira vez dele no app**, de estar estudando **Rust às 7h da manhã**, de estar em uma **sequência de 5 dias concluídos** ou voltando após **uma semana sem conseguir estudar**.
   - O Glint já possui contexto riquíssimo (`User.knowledgeGraph`, `LearningPlan.refinedGoal`, `executableMeta`, `PlanTask`, histórico de progresso e agenda), pronto para alimentar os momentos de transição e entrada.

3. **Falta de Presença Cinematográfica nas Transições de Seção:**
   - Quando o aluno entra no aplicativo ou avança etapas, faltava um momento visual que tomasse a tela inteira (`100dvh`), situasse a pessoa na jornada dela com clareza e revelasse a interface de forma fluida.

---

## 2. A Visão & Padrão Oficial de Palco (`100dvh`)

Cada entrada ou carregamento importante no Glint é um **Palco Full-Screen (`100dvh`)** implementado em [`FullscreenDynamicAnimation`](../app/components/fullscreen-dynamic-animation.tsx), combinando **coreografia vetorial viva dominando mais de 75% da tela** com um **balão de fala editorial no topo (`Fraunces`)**.

### 2.1. Os 5 Pilares Obrigatórios

1. **Tomada de Tela Inteira com Protagonismo da Animação (`> 75%` do Centro Livre):**
   - A animação ocupa `100vw × 100dvh` (`h-dvh w-full overflow-hidden`), tanto no mobile (`9:16`) quanto no desktop (`16:9`, `viewBox="0 0 1440 900"`, `preserveAspectRatio="xMidYMid slice"`).
   - **Proibição de cards centrais bloqueando o palco:** o centro da tela pertence 100% à Abelhinha, às suas trilhas, favos, partículas e expressões — nunca colocar caixas de texto sobre o centro do personagem.

2. **Balão de Fala Editorial no Topo (Sem Borda no Texto, Sem Subtítulo e Sem Eyebrow Badge):**
   - A fala da Abelhinha fica isolada no topo da tela em um **balão de fala Aquarela Viva** (`rounded-3xl bg-[#FFFDF8] px-5 py-3.5 border-2 border-[#F3EFE6]` com sombra suave `shadow-[0_10px_28px_-10px_rgba(45,49,66,0.08)]` e pontinha inferior `rotate-45` apontando para a Abelhinha abaixo).
   - Contém **apenas a frase principal** em **`Fraunces`** (`font-display font-medium tracking-tight text-[#2D3142]`), em escala equilibrada e legível (`clamp(1.05rem, 1.65vw, 1.45rem)`, `lineHeight: 1.3`, `max-w-[34ch]`), revelada suavemente palavra por palavra (`28ms` de stagger, sem *bounce* artificial e sem `WebkitTextStroke`).
   - Sem badge de cena e sem subtítulo abaixo da frase no palco de exibição, garantindo zero poluição visual e separação física total entre o texto e as antenas da abelha.

3. **Mais Cor com a Paleta Aquarela Viva (Zero Neon):**
   - **Cobalto Pastel (`#5B8DEF`):** fitas de voo largas, listras 3D da barriguinha, notinhas musicais e anéis de energia;
   - **Pêssego Coral (`#FF9B85`):** rastros pontilhados dinâmicos, pompons das antenas, solinha do pé, bochechas e balãozinho;
   - **Manteiga Solar (`#FFE07D`):** halos solares, estrelas de 4 pontas, corpo da Abelhinha e preenchimento vivo de favos;
   - **Pistache Claro (`#95E1B0`):** asas simétricas e de perfil, marcos de progresso concluídos e confetes;
   - **Superfícies em Camadas (`#FFFDF8`, `#E8F0FE`, `#FFF0E5`, `#F3EFE6`)** criando profundidade orgânica no fundo da tela.

4. **Modelo Oficial da Abelhinha Frontal (Sem Óculos, Traço Característico do Glint):**
   - Além das poses de perfil em `BeeVectorActor`, as cenas principais de conexão direta (`WAITING_FRONT_TAP` e `FIRST_ACCESS`) utilizam a **Abelhinha Frontal** em `translate(720, 495) scale(1.72)`:
     - **Corpo cápsula gordinho (`112×142`, `rx="56"`)** em Manteiga Solar (`#FFE07D`) com contorno `#F2CC59` e **duas listras curvadas 3D** em Cobalto Pastel (`#5B8DEF`) recortadas por `clipPath`;
     - **Asas simétricas** em Pistache Claro (`#95E1B0`) com contorno `#7AD39B` e **duas anteninhas** com pompons `#FF9B85` e mola secundária (*follow-through*);
     - **Sem óculos** por padrão;
     - **Olhinhos redondos característicos originais da Bee:** círculos escuros (`r="8.2"` em `#2D3142`) com **brilho único limpo** (`r="2.8"` em `#FFFDF8`) e piscada natural (`animate-bee-blink`) — **nunca** usar esclera branca gigante, cílios femininos ou detalhes que descaracterizem o mascote;
     - **Boquinha pequena e característica:** sorriso lateral confiante ou sorriso acolhedor discreto (sem bocão aberto exagerado).

5. **Frase 100% Dinâmica e Instantânea (Pré-Computada por Seção):**
   - Com exceção da mensagem padrão de boas-vindas em `FIRST_ACCESS`, nenhuma frase sai de lista estática quando houver contexto do usuário.
   - As frases falam diretamente com o aluno pelo nome e ficam pré-computadas no banco de dados (atualizadas em background após ações relevantes) para abrir em **`0ms` sem esperar resposta da LLM**.

---

## 3. Catálogo de Cenas Full-Screen (`DynamicAnimationSceneId`)

As cenas oficiais suportadas hoje em [`fullscreen-dynamic-animation.tsx`](../app/components/fullscreen-dynamic-animation.tsx) são:

### Carregando Plano — `WAITING_FRONT_TAP` (`WaitingFrontTapAnimation` — Polling + Botão Voltar)
- **Quando usar:** Enquanto o plano (ou etapa pesada em background) está sendo montado/gerado com **polling em tempo real**, permitindo ao aluno voltar sem perder o processo.
- **Botão de Voltar Integrado:** Botão pill Aquarela Viva no canto superior esquerdo (`topLeftAction` via `onBack` ou `backHref`, com `ArrowLeft` do `@gravity-ui/icons`).
- **Coreografia Full-Screen (Ciclo contínuo `60fps`):**
  - **Postura e Rosto:** Mãozinhas apoiadas na cintura, **sobrancelhas desconfiadinhas (`🤨`)** (esquerda mais baixa e inclinada para o centro, direita bem arqueada no alto), boquinha lateral confiante (`"hmpf"` simpático) e olhar direto para a câmera.
  - **Pezinho Batendo no Compasso (`beatPeriod = 0.58s` / `~103 BPM`):**
    - A perninha esquerda fica firme sustentando o quadril enquanto a **botinha direita** levanta a ponta (exibindo a solinha `#FF9B85`) e bate no chão no compasso;
    - Cada batida dispara **duas ondas concêntricas no chão** (`#FF9B85` e `#5B8DEF`), risquinhos de impacto (`tap!`), um leve *squash & bounce* no corpo e resposta elástica nas antenas.
  - **Atuação em Loop (`6.4s`) e Cenário:**
    - Olhadinhas rápidas para o lado e para o **reloginho despertador flutuante** à esquerda (ponteiro girando no compasso), fazendo biquinho discreto de assobio enquanto solta uma notinha musical `#5B8DEF`;
    - Balãozinho `"..."` animado flutuando à direita e favos suaves nas laterais.
- **Tom da Frase de IA:** Tranquilizador, direto e conectado ao plano em construção, avisando que o aluno pode voltar se quiser.
  - *Exemplo:* `"Calma aí, Bernardo... tô montando seu plano direitinho. Se quiser voltar, eu te aviso assim que ficar pronto!"`

---

### Cena 1 — `FIRST_ACCESS` (`FrontFirstAccessBeeStage` — Primeira Vez no Glint / Pós-Cadastro)
- **Quando dispara:** Na primeira entrada do usuário na plataforma após criar a conta (`/primeiro-plano` ou primeira abertura autenticada quando `onboardingCompleted === false`).
- **Mensagem Padrão Obrigatória (Template Fixo com Nome):**
  - `"Bem vindooo, {userName}! Que bom te ter aqui."` (ex.: `"Bem vindooo, Bernardo! Que bom te ter aqui."`).
- **Coreografia Dinâmica de Pulo + Voo Livre (`cyclePeriod = 4.6s`):**
  - **Fase 1 — Impulso & Salto (`0.00s – 0.85s`):**
    - `0.00s – 0.28s`: Agachamento de preparação (*anticipation squash*: `posY = +12px`, `scaleX = 1.12`, `scaleY = 0.88`) com os bracinhos tomando impulso;
    - `0.28s – 0.85s`: Salto explosivo para cima com *stretch* (`posY` até `-110px`), expandindo um anel solar de impulso no chão (`#FFE07D`).
  - **Fase 2 — Voo Livre em `∞` pelo Palco (`0.85s – 3.75s`):**
    - A Abelhinha frontal decola e voa desenhando uma curva ampla em forma de oito (`∞`) pelo centro do palco (`posX` até `±195`, `posY` oscilando no alto);
    - **Inclinação bancada real (`bankAngle` até `±22°`)** acompanhando `dx/dt`, perninhas recolhidas balançando no ar, asas batendo em alta frequência e bracinhos abertos comemorando;
    - **Trilha Aérea Dinâmica:** rastro curvo em tempo real seguindo a esteira em **Cobalto Pastel (`#5B8DEF`)** e pontilhado **Pêssego Coral (`#FF9B85`)**, enquanto a sombra no chão acompanha `posX` e diminui conforme a altitude;
    - Halo solar giratório atrás e confetes/estrelas de 4 pontas Aquarela Viva flutuando ao redor.
  - **Fase 3 — Pouso Suave & Aceno (`3.75s – 4.60s`):**
    - Desce suavemente de volta ao centro (`x = 0, y = 0`), faz um *landing squash* fofo ao tocar o chão e acena feliz antes do próximo salto.

---

### Cena 2 — `HOME_SPLASH` (Entrada Diária no App / `/home`)
- **Quando dispara:** Ao abrir o Glint na sessão do dia (mobile ou desktop).
- **Coreografia Full-Screen Adaptativa ao Estado do Aluno (`scale 1.92` desktop / `1.55` mobile):**
  - **Variante A — `HOME_SPLASH_READY` (Sessão do Dia Pronta):**
    - A Abelhinha em **Pose 2 (Modo Foco)** faz um voo panorâmico em onda senoidal ampla no centro do viewport, deixando tripla fita aquarela (`#FFE07D` + `#5B8DEF` + rastro pontilhado `#FF9B85`) e 4 partículas na esteira.
  - **Variante B — `HOME_SPLASH_STREAK` (Sequência / Ritmo Forte):**
    - A Abelhinha em **Pose 3 (Voo Rápido)** cruza o palco em alta velocidade (`2500ms`) com 5 linhas de propulsão em parallax ocupando a largura da tela em **Pistache (`#95E1B0`)**, **Manteiga (`#FFE07D`)** e **Coral (`#FF9B85`)**.
  - **Variante C — `HOME_SPLASH_RETURN` (Retorno Após Dias Ausente / Recomeço):**
    - Voo sereno e desacelerado (`3900ms`) sobre halo **Lavanda Gelo (`#E8F0FE`)** + **Areia Suave (`#F3EFE6`)**, com a Abelhinha em **Pose 5 (`curious_34`)** olhando em 3/4 para o aluno com expressão acolhedora sem culpa.
  - **Variante D — `HOME_SPLASH_REST` (Dia Concluído ou Horário Livre):**
    - Voo calmo com a Abelhinha em **Pose 6 (`sleepy` `zZ`)** flutuando serenamente.
- **Tom da Frase de IA:** Situacional — menciona o tema do plano ativo, quantos minutos dura a sessão de hoje, a conquista da semana ou o descanso merecido.
  - *Exemplo (Sessão Pronta):* `"Bernardo, seus 25 minutos de Arquitetura Distribuída já estão prontos para hoje."`
  - *Exemplo (Streak):* `"Quarta sessão concluída nesta semana, Bernardo. Seu ritmo em Rust está impecável!"`

---

### Cena 3 — `PLAN_CREATION` (Construção e Entrevista do Plano / `/criacao-plano/[plan-id]`)
- **Quando dispara:** Durante as transições de geração e processamento da entrevista investigativa (`REFINING_GOAL`, `INTERVIEWING_STEPS`, `GENERATING_TASKS`, `ENRICHING_TASKS`).
- **Coreografia Full-Screen:**
  - Uma constelação central de **10 favos hexagonais conectados por fios pontilhados animados** (`#5B8DEF`) preenche o palco com pulsos de **Manteiga Solar (`#FFE07D`)**, **Creme Pêssego (`#FFF0E5`)** e **Pistache (`#95E1B0`)**.
  - A Abelhinha voa costurando os favos enquanto o balão de fala no topo comenta especificamente a rotina e o objetivo do aluno.
- **Tom da Frase de IA:** Investigativo e conectado às respostas reais do aluno.
  - *Exemplo:* `"Encaixando suas 4 horas semanais à noite para você dominar Next.js 16 sem atropelar a rotina..."`

---

### Cena 4 — `PLANS_HUB` (Visão Geral de Planos, Trilha e Replan / `/planos`)
- **Quando dispara:** Ao entrar na trilha de um plano, concluir um replan conversacional (`/replan`) ou celebrar o avanço entre semanas.
- **Coreografia Full-Screen:**
  - Uma trilha sinuosa ascendente atravessa o palco desenhando os marcos passados em **Pistache (`#95E1B0`)** com ícone de check e o marco atual pulsando com anel expansivo em **Cobalto (`#5B8DEF`)**, com a Abelhinha em **Pose 4 (Comemorando)** voando até o marco atual.
- **Tom da Frase de IA:** Visão macro de progresso ou confirmação empática após um reagendamento/replan.
  - *Exemplo (Pós-Replan):* `"Rota recalculada sem estresse: movi suas sessões de quarta para sábado e mantive sua meta intacta."`

> **Nota de Escopo:** A antiga cena `TASK_ENTRY` (entrada no Split-Workspace da aula) foi **removida definitivamente** do catálogo e da implementação para manter o fluxo da sessão direto e sem barreiras visuais.

---

## 4. Diretrizes de Construção Técnica & Showcase (`/animations`)

1. **Página de Preview & Inspeção (`/animations`):**
   - Implementada em [`app/animations/page.tsx`](../app/animations/page.tsx) e [`app/animations/animations-showcase-client.tsx`](../app/animations/animations-showcase-client.tsx).
   - **Sem HUD superior:** toda a interface de controle fica restrita a um único **dock inferior compacto** com a seleção das cenas (`SCENE_ORDER`) e o botão **"Tela Limpa"** (que oculta o dock deixando apenas um botão discreto `"Mostrar animações"` no canto inferior direito).
2. **Coordenadas Responsivas para Mobile e Desktop:**
   - Palco vetorial `viewBox="0 0 1440 900"` com `preserveAspectRatio="xMidYMid slice"` para preencher `100vw × 100dvh` sem deformar proporções em telas `9:16` ou `16:9`.
   - Nas cenas de voo lateral (`HOME_SPLASH_*`, `PLAN_CREATION`, `PLANS_HUB`), a trajetória cruza o centro da tela (`Y` entre `240` e `580`) com escala responsiva (`1.92` desktop / `1.55` mobile).
3. **Física Orgânica em `requestAnimationFrame` + SVG Vetorial:**
   - Movimento contínuo parametrizado por tempo real (`now - startTime`), filtro passa-baixa exponencial (`1 - Math.exp(-k * dt)`) para amortecimento de posição/rotação, inclinação por derivada da curva e `strokeDashoffset` fisicamente sincronizado.
4. **Coreografia de Entrada, Clímax e Saída (*Curtain Reveal*):**
   - **Fase 1 — Entrada (`0ms – 450ms`):** O palco e a Abelhinha entram imediatamente a `60fps`.
   - **Fase 2 — Revelação Tipográfica (`110ms – 600ms`):** A frase no balão de fala emerge palavra por palavra com `opacity` + `translateY`.
   - **Fase 3 — Saída Fluida (`isExiting`):** Transição suave (`opacity-0 scale-[1.02] duration-500 ease-out`) revelando a tela carregada por baixo sem cortes secos.
5. **Respeito a `prefers-reduced-motion`:**
   - Quando ativo, os loops `requestAnimationFrame` são interrompidos e a cena exibe a composição limpa com a Abelhinha posicionada e a frase completa visível.

---

## 5. Resumo dos Gatilhos de Frases Dinâmicas (Ponte para a Implementação)

Para alimentar essas cenas em `0ms` sem latência no carregamento, a camada de backend/IA deve seguir o mapeamento abaixo:

| Evento / Ação do Usuário | Seções cujas Frases são Pré-Computadas / Atualizadas | Dados do Contexto Usados |
|---|---|---|
| **Criação de Conta / Primeiro Acesso** | `FIRST_ACCESS` (template fixo com nome), `HOME_SPLASH` | `User.name`, horário local. |
| **Respostas na Criação do Plano** | `PLAN_CREATION`, `HOME_SPLASH` | `rawInput`, `refinedGoal`, última resposta da entrevista e `knowledgeGraph`. |
| **Início / Geração do Plano (Polling)** | `WAITING_FRONT_TAP`, `PLAN_CREATION` | `rawInput`, `refinedGoal`, etapa atual da criação do plano. |
| **Aceite do Plano (`accept_plan`)** | `HOME_SPLASH`, `PLANS_HUB` | Meta final, rotina semanal escolhida e detalhes da primeira sessão. |
| **Enriquecimento JIT Concluído (`READY`)** | `HOME_SPLASH` | Título da aula, `whyItMatters`, duração (`consumeMinutes + practiceMinutes`). |
| **Conclusão de Aula (`finishTaskSession`)** | `HOME_SPLASH`, `PLANS_HUB` | Progresso (`completedTasks/totalTasks`), nota de dificuldade, ritmo semanal e próxima aula. |
| **Imprevisto / Reagendamento / Replan** | `HOME_SPLASH`, `PLANS_HUB` | Motivo da mudança, novos dias/horários e mensagem encorajadora sem culpa. |
