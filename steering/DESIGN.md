# Design System — Glint

> Documento vivo com as decisões visuais e de identidade do **Glint**. Consulte também:
> - [`AGENTS.md`](./AGENTS.md) — Visão geral e funcionamento do produto;
> - [`ANIMATIONS.md`](./ANIMATIONS.md) — Playbook oficial da animação do logo e das 6 poses da abelhinha.

---

## 1. Diretrizes Principais de Estilo e UI/UX (Regra de Ouro)

O Glint transmite a sensação de um **mentor caloroso, claro e encorajador**. A estética foge de tons escuros pesados, cores neon ou aparência de template genérico de IA, priorizando **tons pastéis vibrantes, luminosos e acolhedores** com escolhas deliberadas de composição.

### 1.1. Ponto Focal Único (Anti-Dashboard Genérico)
- **Hierarquia centrada na jornada real:** O elemento principal de cada tela deve refletir a essência do Glint (a **Sessão de Hoje**, o **Calendário Vivo** ou a **Conversa com o Mentor**).
- **Proibido o clichê de KPIs:** Evite abrir telas com a clássica fileira genérica de 3–4 cards de estatísticas (*número grande + label pequeno + gradiente decorativo*). Métricas (como *streak* ou semanas concluídas) devem viver integradas ao contexto do calendário ou do cabeçalho.
- **Moderação e Foco:** Concentre o impacto visual em um único ponto marcante por visualização; mantenha os elementos ao redor limpos, funcionais e sem decorações supérfluas.

### 1.2. Higiene Tipográfica e Ritmo de Leitura
- **Contraste de Personalidade:** Use estritamente a dupla oficial — **`Fraunces`** (editorial orgânica para títulos e falas de destaque do mentor) e **`Plus Jakarta Sans`** (funcional para interface, calendário e leitura).
- **Largura e Entrelinha:** Mantenha blocos de leitura, explicações e notas do mentor abaixo de **`75ch`–`80ch`**. Títulos e trechos em `Fraunces` devem ter *line-height* ligeiramente mais generoso e *tracking* suave.
- **Vícios de Layout Proibidos:**
  - **Não** destaque uma palavra aleatória no meio do título com cor ou itálico sem propósito semântico real;
  - **Não** use *eyebrow badges* ou etiquetas desnecessárias acima de todo título principal;
  - **Evite** excesso de rótulos em caixa alta (*ALL CAPS*) espalhados pela interface.

### 1.3. Estrutura Visual e Superfícies (Sem "Mar de Cards Iguais")
- **Hierarquia por Superfície, não por Sombras:** Evite layouts SaaS genéricos onde tudo é um card com o mesmo `border-radius` e sombra cinza espalhada sem hierarquia. Diferencie regiões combinando o fundo Nuvem Quente (`#FFFDF8`), superfícies secundárias Areia Suave (`#F3EFE6`), Lavanda Gelo (`#E8F0FE`), Creme Pêssego (`#FFF0E5`) e branco (`#FFFFFF`).
- **Informação Real em Bordas e Números:** Bordas, divisores, *outlines* e contadores (`tabular-nums`) devem codificar estado e hierarquia real (ex.: sessão concluída em `#95E1B0`, sessão ativa do dia em `#5B8DEF`, nota do mentor em `#FF9B85`), nunca servir como enfeite vazio.

### 1.4. Movimento, Interatividade e Microinterações Intencionais
- **Cursor Pointer Obrigatório (`cursor-pointer`):** Todo elemento clicável ou interativo habilitado — botões (`<button>`, `Button`), links (`<a>`), abas, toggles de visibilidade, cards selecionáveis e controles com `onClick`/`onPress` — **deve obrigatoriamente ter `cursor: pointer` (`cursor-pointer`)**. Nunca deixe botões ou ações clicáveis com o cursor padrão de seta/texto (especialmente no Tailwind v4, onde `<button>` não aplica `pointer` por padrão).
- **Propósito Funcional:** Use animações e transições para responder a ações reais do usuário (iniciar sessão, concluir bloco, expandir dia do calendário) ou dar vida pontual à mascote Abelhinha conforme [`ANIMATIONS.md`](./ANIMATIONS.md).
- **Sem *Scroll-Fade* Repetitivo:** Evite transições genéricas de *fade-and-slide* repetidas em todos os cards e seções ao carregar ou rolar a página.

---

## 2. Paleta de Cores Oficial: **Aquarela Viva**

A paleta **Aquarela Viva** combina uma base clara e aconchegante com cores pastéis luminosas (zero neon), garantindo hierarquia visual clara entre calendário, ação do dia, notas do mentor e progresso acumulado.

### Cores Principais

| Nome | Hex | Papel no Produto |
|---|---|---|
| **Cobalto Pastel** *(Pastel Cobalt)* | `#5B8DEF` | **Cor Primária e de Foco:** Cabeçalhos da marca, anel superior do `g` no logo, haste do `i`, dia ativo no calendário, barra de progresso da jornada de semanas, estados selecionados e links. |
| **Pêssego Coral** *(Peach Coral)* | `#FF9B85` | **Ação Principal (CTA) e Presença do Mentor:** Botão principal da sessão do dia (*"Começar Agora"*), trilha pontilhada inferior do `g`, estrela do `i`, corte do `t`, bochechas/antena da abelhinha e destaques do mentor. |
| **Manteiga Solar** *(Sunny Butter)* | `#FFE07D` | **Brilho ("Glint") e Destaques Rápidos:** Corpo da abelhinha, faísca inicial do `g`, estrelas de 4 pontas, tags de tempo/horário e recompensas visuais. |
| **Pistache Claro** *(Pistachio)* | `#95E1B0` | **Progresso e Conclusão:** Asas da abelhinha, etapas concluídas no roadmap, blocos de calendário finalizados e indicadores positivos de constância. |
| **Nuvem Quente** *(Warm Cloud)* | `#FFFDF8` | **Superfície Principal (Fundo):** Fundo geral da aplicação, trazendo conforto visual de papel claro sem a frieza do branco puro (`#FFFFFF`). |

### Tons de Apoio e Tipografia

| Nome | Hex | Papel no Produto |
|---|---|---|
| **Ardósia Escura** *(Dark Slate)* | `#2D3142` | **Texto Principal e Hastes do Logo:** Títulos, letras `l`, `n` e `t` do wordmark, saudações e corpo de texto de leitura (alto contraste sem usar `#000000`). |
| **Ardósia Suave** *(Muted Slate)* | `#646B82` | **Texto Secundário:** Subtítulos, legendas de horários e metadados do calendário. |
| **Areia Suave** *(Soft Sand)* | `#F3EFE6` | **Superfície Secundária / Inativa:** Blocos de calendário futuros/inativos, divisores sutis e trilhos de barra de progresso. |
| **Lavanda Gelo** *(Ice Blue Tint)* | `#E8F0FE` | **Superfície de Apoio Primária:** Fundos suaves de ícones ativos, seleção de menu e blocos agendados na semana. |
| **Creme Pêssego** *(Warm Peach Tint)* | `#FFF0E5` | **Superfície de Nota do Mentor:** Fundo acolhedor para mensagens e dicas personalizadas dentro do card da sessão de hoje. |

---

## 3. Regras de Uso da Paleta

1. **Zero Neon:** Nenhuma cor deve parecer fluorescente; a vibração vem do contraste entre o fundo creme (`#FFFDF8`) e os tons pastéis solares (`#5B8DEF`, `#FF9B85`, `#FFE07D`, `#95E1B0`).
2. **Um Único Chamado para Ação por Tela:** O **Pêssego Coral (`#FF9B85`)** em preenchimento sólido é reservado para a ação mais importante do momento (ex.: iniciar a sessão planejada para hoje) e para o destaque principal do mentor, evitando competir com outros botões.
3. **Progresso vs. Estado Ativo:**
   - O que está **concluído** usa **Pistache (`#95E1B0`)**.
   - O que está **em andamento hoje** usa **Cobalto Pastel (`#5B8DEF`)**.
   - O que representa **energia, faísca ou conquista ("Glint")** usa **Manteiga Solar (`#FFE07D`)**.

---

## 4. Logo Oficial, Tipografia e Mascote (Abelhinha de Perfil)

### 4.1. Construção do Logo (`Trilha de Voo em "g"` + `lint` Geométrico Bicolor)
O logo oficial do Glint une narrativa visual e geometria limpa em três elementos integrados:
1. **A Letra `g` como Trilha de Voo:**
   - Começa com uma **estrela de 4 pontas em Manteiga Solar (`#FFE07D`)** na base esquerda;
   - Desenha a cauda descendente do `g` com um **rastro pontilhado em Pêssego Coral (`#FF9B85`)**;
   - Fecha o anel superior do `g` em **linha contínua Cobalto Pastel (`#5B8DEF`)**.
2. **A Abelhinha de Perfil no Topo do `g`:**
   - Pousada no canto superior direito do `g` (`-16°`), sempre vista **de perfil** (nunca frontal estilo coruja/Duolingo);
   - Corpo em cápsula **Manteiga Solar (`#FFE07D`)** com **duas listras em Cobalto Pastel (`#5B8DEF`)**, asas em **Pistache (`#95E1B0`)**, olhinho em **Ardósia Escura (`#2D3142`)** com reflexo claro e antena/bochecha em **Pêssego Coral (`#FF9B85`)**.
3. **Wordmark `lint` Geométrico Bicolor (Traçado Vetorial Próprio):**
   - Desenhado em hastes geométricas arredondadas (`9px` de espessura, terminações circulares `rx="4.5"` / `stroke-linecap="round"`):
   - **`l` e `n`:** Ardósia Escura (`#2D3142`);
   - **`i`:** Haste vertical em **Cobalto Pastel (`#5B8DEF`)** + pingo em formato de **estrela de 4 pontas em Pêssego Coral (`#FF9B85`)**;
   - **`t`:** Haste vertical em **Ardósia Escura (`#2D3142`)** + corte horizontal em cápsula **Pêssego Coral (`#FF9B85`)**.

### 4.2. Fontes da Interface (`next/font/google`)
- **Títulos e Destaques (Display / Editorial):** **`Fraunces`** (pesos `400`, `500`, `600`, com suporte a itálico) — serifada editorial orgânica e calorosa, que traz personalidade literária aos títulos e conversa com as curvas da abelhinha sem cair no visual genérico de SaaS.
- **Interface, Calendário e Leitura (Sans):** **`Plus Jakarta Sans`** (pesos `400`, `500`, `600`, `700`, com `tabular-nums` para horários e contadores) — limpa, legível e confortável para blocos de estudo e notas do mentor.

### 4.3. Arquivos Oficiais de Marca (SVG)
- [`public/logo.svg`](./public/logo.svg) — Logo horizontal completo (Trilha de Voo em `g` + Abelhinha de Perfil + `lint` Geométrico Bicolor).
- [`public/logo-icon.svg`](./public/logo-icon.svg) — App Icon quadrado arredondado com a Trilha de Voo em `g` e a Abelhinha.
- [`public/mascot-bee.svg`](./public/mascot-bee.svg) — Mascote Abelhinha de Perfil isolada na pose padrão.

### 4.4. Expressões e Animações (`ANIMATIONS.md`)
As 6 poses oficiais da abelhinha de perfil (**1. Perfil Padrão**, **2. Modo Foco**, **3. Voo Rápido**, **4. Comemorando**, **5. Curiosa**, **6. Sonolenta**) e a animação da abelhinha desenhando o `g` estão especificadas no playbook [`ANIMATIONS.md`](./ANIMATIONS.md).

---

## 5. Ícones e Convenções HeroUI

> **Regra Obrigatória para Agentes:** Sempre utilize os **ícones do ecossistema HeroUI** (`@gravity-ui/icons` — biblioteca padrão adotada pelo HeroUI v3 — ou `@heroicons/react`) em toda a interface. **Nunca** desenhe `<svg>` manuais/improvisados para ícones de UI (como setas, calendário, relógio, check, notificações ou configurações); SVGs autorais são exclusivos do logo e da mascote Abelhinha.

### Diretrizes de Uso de Ícones
1. **Padronização com HeroUI:**
   - Todos os ícones de interface, navegação, blocos do calendário, botões e feedbacks devem vir da biblioteca de ícones do HeroUI.
   - Em botões e controles do HeroUI (`Button`, `Chip`, `Input`, `Tabs`, `Dropdown`), componha os ícones diretamente nos slots/partes exportadas pelos componentes.
2. **Geometria e Peso Visual:**
   - Priorize ícones com traços arredondados (`stroke-linecap="round"`, `stroke-linejoin="round"`) que conversem com a geometria amigável do wordmark `lint` e da Abelhinha.
   - Tamanhos padrão alinhados ao ritmo de `4px`: `size-4` (`16px` em badges/tags de horário), `size-5` (`20px` padrão em botões e itens de calendário) e `size-6` (`24px` em cabeçalhos de seção).
3. **Cores Semânticas nos Ícones (Paleta Aquarela Viva):**
   - **Ícones de ação principal / mentor:** `#FF9B85` (Pêssego Coral) ou `#FFFDF8` quando sobre fundo coral sólido;
   - **Ícones de estado ativo / calendário do dia:** `#5B8DEF` (Cobalto Pastel) sobre superfície `#E8F0FE` (Lavanda Gelo);
   - **Ícones de conclusão / check:** `#95E1B0` (Pistache Claro);
   - **Ícones de tempo / streak / brilho:** `#FFE07D` (Manteiga Solar);
   - **Ícones secundários / metadados:** `#646B82` (Ardósia Suave).
4. **Acessibilidade e Interação (Padrão HeroUI):**
   - Botões apenas com ícone (*icon-only controls*) devem ter área mínima de toque/clique adequada e sempre incluir `aria-label` descritivo.
   - Não use ícones em excesso como mera decoração; cada ícone deve reforçar rapidamente o significado da ação ou do bloco de estudo.

---

## 6. Diretrizes Unslop (Qualidade Visual e Anti-Slop)

Baseado nos conceitos da skill **Unslop** (por Damir Sokolovsky, `@heydamir`, CC BY 4.0), aplicados à identidade do Glint para garantir que cada tela pareça intencionalmente desenhada e nunca um template genérico de IA:

1. **Chrome Silencioso, Riqueza no Momento Certo:**
   - Navegação, botões secundários, bordas e textos usam neutros da paleta e no máximo um destaque.
   - A riqueza visual fica concentrada em **um ponto focal** por tela (ex.: o card da Sessão de Hoje, o Calendário ou a Abelhinha), sem espalhar brilhos, sombras coloridas ou gradientes decorativos pelo restante da interface.
2. **Grid Estrito de `4px`:**
   - Margens, paddings, gaps e alturas fixas seguem múltiplos de `4px` (`16`, `20`, `24`, `32`). Evite valores avulsos que quebram o ritmo (como `mt-[13px]` ou `py-[11px]`).
   - Espaço dentro de um grupo deve ser menor que o espaço entre grupos; itens equivalentes compartilham a mesma altura e alinhamento.
3. **Higiene de Copy (Texto Limpo e Direto):**
   - **Sem pontos de exclamação (`!`)** em textos de interface, botões ou mensagens de erro.
   - **Sem palavras de hype** (*revolucione, desbloqueie, mágico, superpoderes, turbinado*) e sem badges decorativos como `Novo ✨` ou `Beta 🚀`.
   - **Sem ponto final** em títulos, subtítulos, labels, botões e legendas curtas (apenas parágrafos com múltiplas frases mantêm ponto final).
   - **Sentence case** em toda a interface: evite `ALL CAPS` com tracking largo em rótulos.
4. **Ícones e Hierarquia Tipográfica:**
   - Nunca use emojis como ícones de interface ou decoração de rótulos; use sempre `@gravity-ui/icons` / `@heroicons/react` em tamanho consistente (`16px` ou `18px`).
   - Hierarquia vem de **tamanho e cor** (máximo de 3 papéis de texto: principal `#2D3142`, secundário `#646B82`, e destaque `#5B8DEF`), não de pesos extremos (`700`–`900`).
5. **Bordas e Superfícies Contidas:**
   - Bordas são linhas sutis (*hairlines*) usando `#F3EFE6` ou `#2D3142` com baixa opacidade (`6%`–`10%`).
   - Proibido gradientes de matiz em superfícies, texto com gradiente, *glows* coloridos, *blobs* radiais atrás do conteúdo e bordas neon.

