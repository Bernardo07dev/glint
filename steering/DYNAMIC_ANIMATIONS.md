# Plano Steering: Animações Full-Screen & Loaders Dinâmicos com IA (`DYNAMIC_ANIMATIONS.md`)

> Documento de direcionamento (*steering*) que consolida o diagnóstico dos problemas atuais de animação do **Glint**, a especificação visual das novas cenas **Full-Screen (`100dvh`)** e o modelo de **frases 100% dinâmicas geradas por IA** baseadas na situação real do aluno.
> Consulte também [`DESIGN.md`](./DESIGN.md), [`ANIMATIONS.md`](./ANIMATIONS.md) e [`SPEC.md`](./SPEC.md).

---

## 1. Diagnóstico: O Problema Atual no Glint

Embora o Glint tenha uma base funcional sólida e uma identidade visual definida (**Aquarela Viva** + **Abelhinha de Perfil**), a experiência visual de entrada, transição e carregamento sofre de três problemas centrais:

1. **Escala Tímida e Sem Impacto ("Abelhinha Pequena + Frasezinha"):**
   - O [`BeeLoader`](../app/components/bee-loader.tsx) atual renderiza um SVG contido (`w-44 h-22`, ou `w-56 h-28` no tamanho `lg`) isolado no centro de uma tela vazia (`#FFFDF8`), com um rótulo pequeno em `text-lg`.
   - O [`HoneycombLoader`](../app/components/honeycomb-loader.tsx) fica restrito a um quadrado `w-40 h-40` com um balão de fala compacto (`max-w-[36ch]`, fonte `text-xs` / `text-sm`).
   - Em vez de transmitir um produto vivo, colorido e memorável logo ao abrir no celular ou no computador, a animação parece apenas um *spinner* comum.

2. **Frases Estáticas, Repetitivas e Desconectadas do Usuário:**
   - O arquivo [`random-loaders.ts`](../app/api/plan/random-loaders.ts) sorteia strings fixas (*"Batendo as asinhas para preparar o próximo passo"*, *"Anotando tudo no meu caderninho de abelha"*).
   - Todo usuário lê exatamente as mesmas frases, independentemente de ser a **primeira vez dele no app**, de estar estudando **Rust às 7h da manhã**, de estar em uma **sequência de 5 dias concluídos** ou voltando após **uma semana sem conseguir estudar**.
   - O Glint já possui contexto riquíssimo (`User.knowledgeGraph`, `LearningPlan.refinedGoal`, `executableMeta`, `PlanTask`, histórico de progresso e agenda), mas não usa nada disso nos momentos de transição e entrada.

3. **Falta de Presença Cinematográfica nas Transições de Seção:**
   - Quando o aluno entra no aplicativo, avança etapas ou abre uma sessão de estudo, não existe um momento visual que tome a tela inteira (`100dvh`), situe a pessoa na jornada dela com uma frase grande e expressiva, e revele a interface de forma fluida.

---

## 2. A Visão: Como as Novas Animações Devem Funcionar

Cada entrada ou carregamento importante no Glint passa a ser um **Palco Full-Screen (`100dvh`)** combinando **coreografia vetorial viva em tela cheia** com **tipografia editorial grande (`Fraunces`)** alimentada por **frases personalizadas por IA**.

### 2.1. Os 4 Pilares Obrigatórios
1. **Tomada de Tela Inteira (`Full-Viewport Stage`):**
   - A animação ocupa `100vw × 100dvh` (`fixed inset-0 z-50 overflow-hidden`), tanto no mobile (vertical `9:16`) quanto no desktop (panorâmico `16:9`).
   - A Abelhinha não fica parada no meio: ela **cruza o espaço da tela**, desenhando trilhas largas, ondas coloridas, favos luminosos e partículas que preenchem o viewport.
2. **Tipografia Hero em Grande Escala:**
   - A frase gerada pela IA é a protagonista junto com a Abelhinha.
   - Renderizada em **`Fraunces`** com escala dramática (`clamp(1.75rem, 4.2vw, 3.5rem)`), alto contraste em **Ardósia Escura (`#2D3142`)**, entrelinha generosa (`leading-[1.18]`) e largura controlada (`max-w-[24ch–32ch]`), acompanhada opcionalmente de um subtítulo contextual em **`Plus Jakarta Sans`** (`text-base` / `text-lg` em `#646B82`).
3. **Mais Cor com a Paleta Aquarela Viva (Zero Neon):**
   - Uso expressivo e vibrante das cores oficiais em camadas de tela cheia:
     - **Cobalto Pastel (`#5B8DEF`)** em fitas de voo largas e anéis de energia;
     - **Pêssego Coral (`#FF9B85`)** em rastros pontilhados dinâmicos, faíscas e acentos calorosos;
     - **Manteiga Solar (`#FFE07D`)** em halos solares, estrelas de 4 pontas e preenchimento vivo de favos;
     - **Pistache Claro (`#95E1B0`)** em ondas de conquista, asas e celebrações de progresso;
     - **Superfícies em Camadas (`#FFFDF8`, `#E8F0FE`, `#FFF0E5`, `#F3EFE6`)** criando profundidade orgânica no fundo da tela.
4. **Frase 100% Dinâmica e Instantânea (Pré-Computada por Seção):**
   - Nenhuma frase sai de lista estática quando houver contexto do usuário.
   - As frases falam diretamente com o aluno pelo nome e refletem a situação real dele naquela seção específica.
   - Para que a animação comece em **`0ms` sem esperar resposta da LLM**, as frases de cada seção ficam pré-computadas no banco de dados e são atualizadas em background sempre que uma ação relevante acontece.

---

## 3. Catálogo de Cenas Full-Screen por Seção (`AppSection`)

Cada seção do produto possui uma coreografia própria de tela cheia e um contexto específico para a frase gerada pela IA:

### Cena 1 — `FIRST_ACCESS` (Primeira Vez no Glint / Pós-Cadastro)
- **Quando dispara:** Na primeira entrada do usuário na plataforma após criar a conta (`/primeiro-plano` ou primeira abertura autenticada quando `onboardingCompleted === false`).
- **Coreografia Full-Screen:**
  - A tela inicia banhada em **Nuvem Quente (`#FFFDF8`)** com um halo expansivo em **Manteiga Solar (`#FFE07D`)** e **Creme Pêssego (`#FFF0E5`)**.
  - A Abelhinha entra em voo largo desde a borda inferior esquerda até o centro-topo, desenhando uma grande espiral ascendente que cruza a tela inteira com fita dupla (`#5B8DEF` + `#FF9B85`) e espalhando estrelas de 4 pontas.
  - À medida que a abelha cruza o eixo central, a frase de boas-vindas se revela palavra por palavra em `Fraunces` gigante.
- **Tom da Frase de IA:** Acolhedor, inaugural, chamando pelo nome e marcando o início da jornada personalizada.
  - *Exemplo:* `"Bem-vindo ao seu próprio ritmo, Bernardo. A partir de hoje, qualquer meta grande vira um passo claro por dia."`

### Cena 2 — `HOME_SPLASH` (Entrada Diária no App / `/home`)
- **Quando dispara:** Ao abrir o Glint na sessão do dia (mobile ou desktop).
- **Coreografia Full-Screen Adaptativa ao Estado do Aluno:**
  - **Variante A — Sessão do Dia Pronta (`READY` / `AVAILABLE`):**
    - A Abelhinha (Pose 1 → Pose 2) faz um voo rasante panorâmico da esquerda para a direita através da tela inteira, deixando uma onda senoidal ampla em `#5B8DEF` e `#FF9B85` que abre espaço central para a frase do dia.
  - **Variante B — Sequência / Ritmo Forte (`Streak`):**
    - A Abelhinha em **Pose 3 (Voo Rápido)** cruza o palco em alta velocidade com linhas de propulsão em parallax ocupando a largura da tela e partículas **Pistache (`#95E1B0`)** + **Manteiga (`#FFE07D`)**.
  - **Variante C — Retorno Após Dias Ausente / Recomeço:**
    - Movimento suave e desacelerado sobre fundo **Lavanda Gelo (`#E8F0FE`)** + **Areia Suave (`#F3EFE6`)**, com a Abelhinha em **Pose 5 (`lookAtUser={true}`)** olhando em 3/4 para o aluno com expressão acolhedora.
  - **Variante D — Dia Concluído ou Horário Livre:**
    - Palco suave com estrelas lentas e a Abelhinha em **Pose 6 (Sonolenta `zZ`)** flutuando serenamente.
- **Tom da Frase de IA:** Situacional — menciona o tema do plano ativo, quantos minutos dura a sessão de hoje, a conquista de ontem ou o descanso merecido.
  - *Exemplo (Sessão Pronta):* `"Bernardo, seus 25 minutos de Arquitetura distribuída já estão prontos. Hoje vamos direto para filas assíncronas."`
  - *Exemplo (Streak):* `"Quarta sessão concluída nesta semana. Seu ritmo em Inglês Técnico está impecável!"`

### Cena 3 — `PLAN_CREATION` (Construção e Entrevista do Plano / `/criacao-plano/[plan-id]`)
- **Quando dispara:** Durante as transições de geração e processamento da entrevista investigativa (`REFINING_GOAL`, `INTERVIEWING_STEPS`, `GENERATING_TASKS`, `ENRICHING_TASKS`).
- **Coreografia Full-Screen:**
  - Uma constelação de favos hexagonais em grande escala ocupa o fundo da tela com ondas de preenchimento em **Manteiga Solar (`#FFE07D`)**, **Pêssego Coral (`#FF9B85`)** e **Cobalto Pastel (`#5B8DEF`)**.
  - A Abelhinha voa entre os favos conectando-os com fios luminosos contínuos enquanto a frase principal (em `Fraunces` grande no centro do palco) comenta especificamente o que o usuário acabou de responder ou o objetivo que está sendo desenhado.
- **Tom da Frase de IA:** Investigativo e conectado às respostas reais do aluno.
  - *Exemplo:* `"Encaixando suas 4 horas semanais à noite para você dominar Next.js sem atropelar o trabalho na Ericsson..."`

### Cena 4 — `TASK_ENTRY` (Entrada no Workspace da Aula / `/planos/[planId]/tasks/[taskId]`)
- **Quando dispara:** Ao abrir uma sessão de estudo ou enquanto a preparação sob demanda (`enrichTaskNowAction`) monta o conteúdo da aula.
- **Coreografia Full-Screen:**
  - A Abelhinha entra em **Pose 2 (Modo Foco — Óculos Redondos `#FF9B85` + Livrinho `#5B8DEF`)**, com a ponta da antena acesa em `#FFE07D`.
  - Duas grandes faixas curvas em **Lavanda Gelo (`#E8F0FE`)** e **Creme Pêssego (`#FFF0E5`)** se abrem do centro para as bordas (imitando a abertura do Split-Workspace de estudo) quando a aula fica pronta.
- **Tom da Frase de IA:** Focado na missão prática daquela aula específica (`title`, `whyItMatters`, `consumeMinutes` + `practiceMinutes`).
  - *Exemplo:* `"Hora de colocar os óculos de foco: 12 minutos de vídeo direto ao ponto e um desafio prático sobre Server Actions."`

### Cena 5 — `PLANS_HUB` (Visão Geral de Planos, Trilha e Replan / `/planos`)
- **Quando dispara:** Ao entrar na trilha de um plano, concluir um replan conversacional (`/replan`) ou celebrar o avanço entre semanas.
- **Coreografia Full-Screen:**
  - Uma trilha sinuosa em tela cheia desenha os marcos passados em **Pistache (`#95E1B0`)** e o marco atual pulsando em **Cobalto (`#5B8DEF`)**, com a Abelhinha em **Pose 4 (Comemorando)** ou **Pose 1** pousando sobre a etapa atual.
- **Tom da Frase de IA:** Visão macro de progresso ou confirmação empática após um reagendamento/replan.
  - *Exemplo (Pós-Replan):* `"Rota recalculada sem estresse: movi suas sessões de quarta para sábado de manhã e mantive sua meta final intacta."`

---

## 4. Diretrizes de Construção Visual na IDE (Como as Animações Devem Ser Feitas)

Para garantir acabamento de alto nível quando construirmos e inspecionarmos essas animações na IDE:

1. **Coordenadas Responsivas para Mobile e Desktop:**
   - No **Desktop (`16:9`)**, a trajetória principal da Abelhinha deve explorar a horizontalidade ampla (varrendo de `-10%` a `110%` da largura com curvas senoidais generosas).
   - No **Mobile (`9:16`)**, a trajetória deve usar diagonais ascendentes ou órbitas amplas que preencham a altura da tela (`100dvh`), mantendo a frase centralizada na zona nobre de leitura (terço central da tela).
2. **Física Orgânica em `requestAnimationFrame` + SVG Vetorial:**
   - Manter a precisão matemática de [`animated-logo.tsx`](../app/components/animated-logo.tsx) e [`bee-loader.tsx`](../app/components/bee-loader.tsx): movimento contínuo parametrizado por tempo, inclinação suave calculada pela derivada da curva (com amortecimento para nunca virar de ponta-cabeça) e rastro pontilhado com `strokeDashoffset` fisicamente sincronizado.
3. **Coreografia de Entrada, Clímax e Saída (*Curtain Reveal*):**
   - **Fase 1 — Entrada (`0ms – 450ms`):** O fundo aquarelado e a Abelhinha entram imediatamente a `60fps`; a trilha começa a cortar a tela.
   - **Fase 2 — Revelação Tipográfica (`300ms – 1600ms`):** A frase grande em `Fraunces` emerge com transição suave sincronizada com a passagem da abelha (sem *bounce* artificial ou *scroll-fade* genérico).
   - **Fase 3 — Saída Fluida (`1600ms – 2100ms`):** O palco full-screen não "pisca" nem desaparece seco; ele abre suavemente (via `opacity` + leve `scale(1.02)` ou máscara circular/radial acompanhando o voo final da abelha) revelando a tela já carregada por baixo.
4. **Respeito a `prefers-reduced-motion`:**
   - Usuários com redução de movimento ativa veem a composição full-screen estática com a arte da Abelhinha na pose correspondente e a frase dinâmica em destaque, com transição suave de opacidade.

---

## 5. Resumo dos Gatilhos de Frases Dinâmicas (Ponte para a Arquitetura)

Para alimentar essas cenas sem latência no carregamento, o sistema se apoia no ciclo abaixo (que detalharemos na etapa de Arquitetura):

| Evento / Ação do Usuário | Seções cujas Frases são Regeneradas em Background | Dados do Contexto Usados pela IA |
|---|---|---|
| **Criação de Conta / Primeiro Acesso** | `FIRST_ACCESS`, `HOME_SPLASH` | Nome do usuário, horário local, boas-vindas inaugurais. |
| **Respostas na Criação do Plano** | `PLAN_CREATION`, `HOME_SPLASH` | `rawInput`, `refinedGoal`, última resposta da entrevista e `knowledgeGraph`. |
| **Aceite do Plano (`accept_plan`)** | `HOME_SPLASH`, `PLANS_HUB`, `TASK_ENTRY` | Meta final, rotina semanal escolhida e detalhes da primeira sessão. |
| **Enriquecimento JIT Concluído (`READY`)** | `TASK_ENTRY`, `HOME_SPLASH` | Título da aula, `whyItMatters`, tools da sessão (`video`, `quiz`, `concept_explainer`). |
| **Conclusão de Aula (`finishTaskSession`)** | `HOME_SPLASH`, `PLANS_HUB`, `TASK_ENTRY` | Progresso (`completedTasks/totalTasks`), nota de dificuldade, ritmo semanal e próxima aula. |
| **Imprevisto / Reagendamento / Replan** | `HOME_SPLASH`, `PLANS_HUB` | Motivo da mudança, novos dias/horários e mensagem encorajadora sem culpa. |
