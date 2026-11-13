# Design System — Glint

> Documento vivo com as decisões visuais e de identidade do **Glint**. Consulte também:
> - [`AGENTS.md`](./AGENTS.md) — Visão geral e funcionamento do produto;
> - [`ANIMATIONS.md`](./ANIMATIONS.md) — Playbook oficial da animação do logo e das 6 poses da abelhinha.

---

## 1. Direção Visual Geral

O Glint transmite a sensação de um **mentor caloroso, claro e encorajador**. A estética foge de tons escuros pesados ou cores neon agressivas, priorizando **tons pastéis vibrantes, luminosos e acolhedores** que convidam o usuário a estudar com leveza todos os dias.

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
- **Títulos e Destaques (Display):** `Fredoka` (pesos `600`/`700`) ou `Quicksand` (`700`), acompanhando as terminações redondas do wordmark.
- **Interface, Calendário e Leitura (Sans):** `Plus Jakarta Sans` (pesos `400`, `500`, `600`, `700`).

### 4.3. Arquivos Oficiais de Marca (SVG)
- [`public/logo.svg`](./public/logo.svg) — Logo horizontal completo (Trilha de Voo em `g` + Abelhinha de Perfil + `lint` Geométrico Bicolor).
- [`public/logo-icon.svg`](./public/logo-icon.svg) — App Icon quadrado arredondado com a Trilha de Voo em `g` e a Abelhinha.
- [`public/mascot-bee.svg`](./public/mascot-bee.svg) — Mascote Abelhinha de Perfil isolada na pose padrão.

### 4.4. Expressões e Animações (`ANIMATIONS.md`)
As 6 poses oficiais da abelhinha de perfil (**1. Perfil Padrão**, **2. Modo Foco**, **3. Voo Rápido**, **4. Comemorando**, **5. Curiosa**, **6. Sonolenta**) e a animação da abelhinha desenhando o `g` estão especificadas no playbook [`ANIMATIONS.md`](./ANIMATIONS.md).
