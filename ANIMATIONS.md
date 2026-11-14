# Playbook de Animações — Glint (`ANIMATIONS.md`)

> Especificação oficial das animações vetoriais (SVG + CSS/JS) da **Abelhinha de Perfil** e do **Logo "Trilha de Voo em `g`"** do Glint.
> Consulte também [`DESIGN.md`](./DESIGN.md) para a paleta **Aquarela Viva** e [`AGENTS.md`](./AGENTS.md) para o contexto do produto.

---

## 1. Princípios Gerais de Movimento

1. **Leveza de Aquarela:** Nenhum movimento deve ser brusco ou robótico. Todas as transições usam curvas suaves (`cubic-bezier(0.4, 0, 0.2, 1)` ou `ease-in-out`).
2. **Dois Loops Base Reutilizáveis:**
   - **Batida de Asas (`wingBeat`):** Ciclo rápido (`160ms–180ms`) alternando `scaleY(1) -> scaleY(0.6)` com leve rotação nas asas Pistache (`#95E1B0`).
   - **Flutuação Suave (`gentleFloat`):** Ciclo respiratório (`2.4s`) movendo o corpo em `translateY(0px -> -3.5px)` para dar vida sem distrair a leitura.
3. **Respeito à Acessibilidade:** Em ambientes com `prefers-reduced-motion: reduce`, pausar loops infinitos de voo e exibir o frame final estático (`public/logo.svg`).

```css
@keyframes wingBeat {
  0%, 100% { transform: rotate(-14deg) scaleY(1); }
  50% { transform: rotate(-4deg) scaleY(0.62); }
}

@keyframes gentleFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3.5px); }
}

@keyframes starPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.22); opacity: 0.85; }
}
```

---

## 2. Animação de Assinatura: **A Abelhinha Desenhando o `g` do Logo**

Usada no *onboarding*, abertura do app e transições de criação do Plano de Estudos.

- **Duração Total:** `1850ms` (curva orgânica contínua por comprimento de arco real `lowerLen + upperLen`, com partida suave em seno e pouso desacelerado *quintic-out*).
- **Trajetória Contínua (`lowerPath` + `upperPath`):**
  1. **Partida na Estrela (`#FFE07D`):** A estrela de 4 pontas pulsa na base esquerda do `g` (`x: 38, y: 89`) enquanto a abelhinha inicia o voo sem saltos de posição.
  2. **Cauda Pontilhada Progressiva (`0 -> lowerLen`):** A abelhinha mergulha pela curva inferior e sobe revelando ponto a ponto o rastro em **Pêssego Coral (`#FF9B85`, `stroke-dasharray="1 10"`)** através de uma `<mask>` SVG animada no sentido do voo.
  3. **Anel Superior Contínuo (`lowerLen -> totalLen`):** Sem quebra de velocidade na junção `(80, 46)`, a abelhinha contorna o anel superior desenhando a linha sólida em **Cobalto Pastel (`#5B8DEF`, `stroke-dashoffset: upperLen -> 0`)** até pousar suavemente no topo direito (`translate(80, 31) rotate(-16)`).
- **Orientação e Amortecimento (Fluidez e Leveza):**
  - A inclinação da abelha usa uma janela de tangente suavizada (`±5.5px`), atenuada (`0.62x`, limitada a `[-72°, 68°]`) para que ela nunca vire de ponta-cabeça no topo do loop.
  - Posição (`x, y`) e rotação passam por amortecimento exponencial (*spring/low-pass filter*) e uma leve ondulação senoidal de voo (`hoverWave`), fazendo *smoothstep blend* nos últimos `26%` do trajeto até o pouso em `-16°`.

---

## 3. Playbook das 6 Poses e Expressões da Abelhinha (Perfil)

A abelhinha é sempre desenhada **de perfil** (corpo cápsula `52x36` em `#FFE07D`, duas listras `#5B8DEF`, asas `#95E1B0`, olho `#2D3142`, bochecha e ponta da antena em `#FF9B85`), podendo espelhar horizontalmente (`scale(-1, 1)`) para olhar para o card ou texto ao lado.

---

### Pose 1 — **Perfil Padrão (Logo & Saudação)**
- **Quando usar:** No topo direito da letra `g` do logo ([`public/logo.svg`](./public/logo.svg)), no cabeçalho (*"Bom dia, Bernardo ✨"*) e em estados neutros da interface.
- **Geometria e Detalhes:**
  - Inclinação base: `0°` (isolada) ou `-16°` (pousada no `g`).
  - Olho circular (`r="4.2"` em `#2D3142`) com brilho branco superior (`r="1.5"` em `#FFFDF8`).
  - Sorriso lateral curto (`Q 24.5 7.5 26 4.5`) e faísca de 4 pontas `#FF9B85` atrás da cauda.
- **Comportamento Animado:**
  - Loop `wingBeat` (`180ms`) + `gentleFloat` (`2.4s`).
  - A ponta da antena (`#FF9B85`) e a estrela da cauda alternam `starPulse` a cada `1.6s`.

---

### Pose 2 — **Modo Foco (Estudando / Sessão Ativa)**
- **Quando usar:** Durante a sessão de estudo do dia (ex.: card *"Sessão de Hoje · 25 min"* em andamento, timer ativo ou leitura de conteúdo).
- **Geometria e Detalhes:**
  - Inclinação base: `0°` (estável e concentrada).
  - **Óculos Redondos de Perfil:** Aro circular (`r="7.5"`, `stroke="#FF9B85"`, lente translúcida `#FFFDF8` com `opacity="0.5"`) e haste lateral conectando ao corpo.
  - **Livrinho Aberto:** Posicionado à frente em **Cobalto Pastel (`#5B8DEF`)** com páginas em **Lavanda Gelo (`#E8F0FE`)**.
  - Ponta da antena muda para **Manteiga Solar (`#FFE07D`)** simbolizando "lâmpada de foco acesa".
- **Comportamento Animado:**
  - Asas desaceleram (`wingBeat` a `320ms` ou paradas em repouso) para não gerar ruído visual enquanto o aluno lê.
  - O livrinho faz uma micro-oscilação vertical (`translateY(0 -> -1.5px)` a cada `3s`) sincronizada com uma piscada rápida do olho (`scaleY(1 -> 0.1 -> 1)` a cada `4.5s`).

---

### Pose 3 — **Voo Rápido / Impulso (Constância & Streak)**
- **Quando usar:** Ao exibir sequência de dias cumpridos no calendário, barras de progresso semanais avançando ou notificações de ritmo (*"3 dias seguidos no horário!"*).
- **Geometria e Detalhes:**
  - Inclinação base: `-14°` (inclinada para frente em velocidade).
  - Asas mais anguladas para trás (`-28°` e `-8°`).
  - **Olho Determinado:** Arco superior fechado em sorriso de impulso (`d="M 13 -1 Q 17.5 -5 21 -1"`).
  - **Linhas de Velocidade + Faísca:** Três trilhas tracejadas horizontais em `#FF9B85` (`stroke-dasharray="2 6"`) + estrela `#FFE07D` na retaguarda.
- **Comportamento Animado:**
  - `wingBeat` acelerado (`110ms`).
  - As linhas tracejadas de velocidade animam `stroke-dashoffset` continuamente da direita para a esquerda (`400ms linear infinite`), criando sensação de propulsão.

---

### Pose 4 — **Comemorando (Conquista / Sessão Concluída)**
- **Quando usar:** Ao concluir uma sessão do calendário, finalizar uma etapa semanal do roadmap ou desbloquear um marco do plano.
- **Geometria e Detalhes:**
  - Inclinação base: `-22°` (empinada para cima com entusiasmo).
  - **Olho Feliz em Arco** (`Q 17 -5 21 0`) + boquinha aberta sorrindo preenchida em `#FF9B85`.
  - **Explosão de Confetes/Estrelas:** Estrelas de 4 pontas em `#FFE07D` e `#FF9B85` + bolinhas Pistache (`#95E1B0`) ao redor do corpo.
- **Comportamento Animado:**
  - Entrada com *spring bounce* vertical (`translateY(12px -> -6px -> 0px)` em `500ms`) + giro comemorativo leve (`rotate(-22deg -> -30deg -> -22deg)`).
  - As estrelas ao redor disparam do centro para fora (`scale(0 -> 1.15 -> 1)` com *stagger* de `80ms`).

---

### Pose 5 — **Curiosa / Pensativa (Entrevista Inicial & Perguntas do Mentor)**
- **Quando usar:** Na etapa **1. Escolha do Tema e Entrevista Inicial**, quando a IA está formulando perguntas estratégicas ou aguardando a resposta do usuário, e nos cards de reflexão do mentor.
- **Geometria e Detalhes:**
  - Inclinação base: `+4°` (levemente inclinada para trás, observando).
  - Pupila deslocada para o alto (`cy="-1"`, `cy="-2.6"` no brilho) olhando para o ponto de interrogação.
  - Boquinha em pequeno "o" curioso (`circle r="2"`).
  - **Símbolo `?` em Cobalto Pastel (`#5B8DEF`)** flutuando à frente da antena.
- **Comportamento Animado:**
  - O `?` flutua e inclina suavemente (`rotate(-6deg -> 6deg)` a cada `1.8s`).
  - A antena faz um leve movimento de "sondagem" (`rotate(-4deg -> 4deg)` com origem na cabeça).

---

### Pose 6 — **Sonolenta / Modo Descanso (Pausa, Noite & Reagendamento Suave)**
- **Quando usar:** Em dias ou horários marcados como **livres/descanso** na rotina real do usuário, no modo noturno após o expediente de estudos, ou quando o usuário precisa reagendar uma sessão sem culpa.
- **Geometria e Detalhes:**
  - Inclinação base: `+8°` (relaxada).
  - **Asas Caídas** (`rotate(-32deg)`, `opacity="0.7"`) em repouso.
  - **Olho Fechado para Baixo** (`d="M 13 1 Q 17 5 21 1"`).
  - **Antena Curvada para Baixo** (`Q 27 -16 33 -9`) com brilho suave em `#FFE07D`.
  - Letras **`z` (`#5B8DEF`)** e **`Z` (`#FF9B85`)** flutuando acima da cabeça.
- **Comportamento Animado:**
  - Sem batida de asas (`wingBeat` desligado).
  - Flutuação lenta de respiração (`gentleFloat` em `4s`).
  - Os `zZ` sobem lentamente na diagonal (`translate(0, 0) -> translate(6px, -10px)` com `opacity: 0 -> 1 -> 0` a cada `2.8s`).

---

## 4. Resumo de Mapeamento no Produto

| Momento da Jornada no Glint | Pose / Animação Oficial | Cor Dominante de Apoio |
|---|---|---|
| Abertura / Criação do Plano | **Animação do Voo em `g`** (Seção 2) | `#5B8DEF` + `#FF9B85` + `#FFE07D` |
| Header, Logo e Saudação Diária | **1. Perfil Padrão** | `#FFE07D` + `#5B8DEF` |
| Entrevista Investigativa / Chat Mentor | **5. Curiosa (`?`)** | `#5B8DEF` |
| Sessão do Calendário em Execução | **2. Modo Foco (Óculos + Livro)** | `#FF9B85` + `#E8F0FE` |
| Conclusão de Sessão / Etapa | **4. Comemorando (Estrelas)** | `#95E1B0` + `#FFE07D` |
| Sequência de Dias / Ritmo Semanal | **3. Voo Rápido (Streak)** | `#FF9B85` + `#FFE07D` |
| Horário Livre / Descanso / Reagendar | **6. Sonolenta (`zZ`)** | `#F3EFE6` + `#5B8DEF` |
