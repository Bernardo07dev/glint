# AGENTS.md — Arquitetura de Agentes: "Learn Anything" & Motor Adaptativo de Planos de Ação

> **Projeto:** Grafo / Omnis (Learn Anything OS)  
> **Conceito Central:** Sistema operacional cognitivo agêntico que conhece profundamente o perfil, o tempo e as limitações do usuário, co-projeta planos de ação realistas para qualquer objetivo de aprendizado e atua como tutor socrático ativo adaptado à rotina do dia a dia.  
> **Trilha Hack Brasil 2026:** Trilha 03 — Acesso à Educação & Capacitação  
> **Diferencial Anti-Chatbot (Item 5.2):** Substitui prompts passivos por um grafo dinâmico de competências com sincronização de calendário, micro-desafios diários e responsabilização ativa (*accountability*).

---

## 1. Visão Sistêmica da Arquitetura

O sistema opera sobre um **Ciclo Contínuo de Perfilamento, Planejamento e Execução Guiada**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                           CAMADA DO USUÁRIO                            │
 │        Entrada de Metas, Disponibilidade Semanal, Feedback e Ações    │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │               AGENTE 1: COGNITIVE & ROUTINE PROFILER                   │
 │   - Memória de Longo Prazo (Mem0 / Vetores / GraphDB)                  │
 │   - Cronótipo, Estilo de Aprendizagem, Nível Base e Rotina Real        │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │             AGENTE 2: SOCRATIC GOAL REFINER & SCOPER                   │
 │   - Desmonta objetivos vagos ("quero aprender IA") em marcos mensuráveis│
 │   - Entrevista socrática de alinhamento de escopo                      │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │           AGENTE 3: ACTION PLANNER & SCHEDULE SYNTHESIZER              │
 │   - Decomposição em Grafo Direcionado Acíclico (DAG) de Habilidades    │
 │   - Micro-blocos de ação alocados na agenda real do usuário             │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │             AGENTE 4: ADAPTIVE DISPATCHER & DRILLMASTER                │
 │   - Execução diária socrática (voz, texto, checagem rápida)            │
 │   - Desafios curtos de 10 a 25 minutos                                 │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │        AGENTE 5: FRICTION DETECTOR & DYNAMIC RE-CALIBRATOR             │
 │   - Detecta procrastinação, dias perdidos ou cansaço                   │
 │   - Rebalanceia o plano automaticamente sem gerar culpa pedagógica      │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Catálogo Detalhado de Agentes

---

### Agente 1: `cognitive_routine_profiler` (O Agente de Conhecimento do Usuário)
- **Missão:** Construir e manter o **"User Cognitive Twin"** (gêmeo cognitivo do usuário). Ele aprende como o usuário pensa, quando rende melhor e quais seus bloqueios.
- **Camada de Memória:**
  - **Memória Semântica:** Histórico de tópicos dominados, facilidade com lógica vs. teoria, vocabulário preferido.
  - **Memória Episódica:** Sessões anteriores onde o usuário travou ou fluiu com facilidade.
  - **Memória Operacional/Rotina:** Horários livres por dia da semana (ex: "segunda tem 45 min no almoço; sábado de manhã tem 2h livres; quarta à noite tem pico de cansaço").
- **Técnica:** Extração contínua de entidades e preferências a partir de diálogos, com persistência relacional e vetorial.
- **Modelo Base:** `gemini-2.5-flash` com chamadas a banco vetorial/relacional (Convex / PostgreSQL com pgvector).

---

### Agente 2: `socratic_goal_refiner` (O Arquiteto de Metas)
- **Missão:** Transformar intenções vagas e abstratas em objetivos curriculares precisos e auditáveis.
- **Exemplo de Comportamento:**
  - *Usuário diz:* "Quero aprender Rust para construir sistemas distribuídos."
  - *Agente atua:* Não gera uma lista genérica de livros. Ele indaga: *"Qual sua fluência atual com linguagens de baixo nível como C/C++ ou você vem de linguagens com Garbage Collection como TypeScript/Python? Qual o primeiro projeto real que você quer ver rodando daqui a 3 semanas?"*
- **Entregável:** Uma especificação formal de objetivo (**Target Mastery Spec**) com marcos claros de sucesso e projetos práticos como prova de domínio.

---

### Agente 3: `action_planner_synthesizer` (O Engenheiro do Plano de Ação)
- **Missão:** Compilar o objetivo em um **Grafo Direcionado Acíclico (DAG) de Aprendizagem** e encaixá-lo diretamente na vida real do usuário.
- **Mecanismo de Geração:**
  1. **Decomposição em Pré-requisitos:** Nenhum conceito avançado é apresentado sem que o nó anterior tenha sido concluído.
  2. **Micro-Sprints de Execução:** Divide tópicos densos em blocos de 15, 30 ou 45 minutos (respeitando o limite de foco do usuário mapeado pelo Agente 1).
  3. **Alocação de Tempo Real:** Se o usuário só tem 20 minutos na terça-feira, o plano agenda uma revisão ativa socrática ou flashcards conceituais, nunca a leitura de um artigo de 40 páginas.
- **Saída Estruturada:**
```json
{
  "goal_id": "learn_distributed_systems_rust",
  "total_estimated_weeks": 6,
  "weekly_plan": [
    {
      "week_number": 1,
      "focus_milestone": "Ownership, Borrow Checker e Gerenciamento de Memória",
      "sessions": [
        {
          "day": "Monday",
          "time_window": "07:30 - 08:00",
          "duration_minutes": 30,
          "task_type": "conceptual_socratic_drill",
          "task_objective": "Diferenciar Stack vs. Heap e entender regras de empréstimo mutável",
          "deliverable": "Explicar em áudio com suas próprias palavras para a IA ou corrigir 3 trechos com erros do compilador"
        }
      ]
    }
  ]
}
```

---

### Agente 4: `adaptive_socratic_tutor` (O Tutor de Execução Diária)
- **Missão:** Conduzir a sessão de aprendizado no horário agendado de forma ativa e interativa.
- **Regras Operacionais Estritas:**
  - **Zero Aulas Expositivas Passivas:** Em vez de fornecer resumos longos, o agente formula desafios, cenários de raciocínio e perguntas de checagem.
  - **Modo Voz & Multimodal:** O usuário pode responder por voz no trânsito ou enviar rascunhos em guardanapo/caderno.
  - **Validação de Domínio:** O nó do plano só avança se o usuário demonstrar domínio conceitual (Princípio Feynman reverso: o aluno explica o conceito para a IA).

---

### Agente 5: `friction_recalibrator` (O Agente Anti-Culpa e Anti-Procrastinação)
- **Missão:** Lidar com a realidade humana — dias corridos, cansaço, imprevistos e atrasos.
- **Comportamento Diferenciado:**
  - Aplicativos tradicionais acumulam tarefas atrasadas em vermelho, gerando ansiedade e abandono.
  - O `friction_recalibrator` detecta o atraso e recalcula a rota silenciosamente: *"Vi que ontem foi puxado no trabalho. Em vez de acumular duas sessões hoje, reduzi a meta de hoje para 10 minutos focando apenas no essencial, e redistribuí o restante no sábado. Vamos nessa?"*
- **Algoritmo de Rebalanceamento:** Ajuste de pesos no grafo de aprendizagem priorizando o caminho crítico (*critical path*) para manter o prazo final viável.

---

## 3. Protocolos de Dados & Estado Reativo

A plataforma opera com um estado compartilhado em tempo real (Convex + Postgres):

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal

class UserCognitiveProfile(BaseModel):
    user_id: str
    chronotype: Literal["early_morning", "midday", "night_owl"]
    avg_focus_span_minutes: int = Field(default=25, ge=10, le=90)
    preferred_modality: Literal["voice", "hands_on_code", "visual_diagrams", "text_socratic"]
    weekly_hours_budget: float
    streak_resilience_score: float = Field(default=0.8, description="Tolerância a dias intensos")

class LearningNode(BaseModel):
    node_id: str
    title: str
    prerequisite_node_ids: List[str]
    estimated_minutes: int
    mastery_status: Literal["locked", "available", "in_progress", "mastered"]
    evidence_of_mastery: Optional[str] = None

class ActionPlan(BaseModel):
    plan_id: str
    user_id: str
    macro_goal: str
    nodes: List[LearningNode]
    adaptive_buffer_days: int = 4
```

---

## 4. Como a IA "Conhece o Usuário" na Prática

1. **Onboarding Conversacional Conciso (3 min):**
   - Não usa questionários chatos com 20 perguntas. É um diálogo rápido por áudio ou chat onde o usuário conta o que quer aprender, em quanto tempo e qual sua rotina básica.
2. **Observação Comportamental Passiva:**
   - O sistema mede o tempo de resposta, taxa de conclusão por horário do dia e momentos em que o usuário pede pausas.
3. **Refinamento Contínuo de Perfil:**
   - Se o usuário consistentemente pula sessões das 21h, o sistema para de agendar sessões noturnas e sugere micro-doses matinais de 15 minutos.

---

## 5. Roteiro de Demonstração para a Banca Avaliadora (Hack Brasil)

- **Minuto 0:00–0:45 (A Dor):** Mostrar o contraste entre o modelo atual (chatbots genéricos que despejam listas de textos que ninguém lê ou apps com tarefas rígidas que o usuário abandona no 3º dia) versus a necessidade de planos integrados à rotina real.
- **Minuto 0:45–1:40 (Co-criação do Plano):** O usuário fala por voz: *"Preciso dominar Machine Learning aplicado a negócios até o fim do mês, mas trabalho em período integral e só tenho 30 minutos por dia"*. A IA faz 2 perguntas socráticas de calibragem, analisa os horários disponíveis e gera instantaneamente o grafo de aprendizagem com micro-metas diárias.
- **Minuto 1:40–2:20 (Execução Socrática Diária):** O aluno abre a sessão do dia; a IA faz um teste socrático por voz, avalia o raciocínio e valida o nó no grafo em tempo real.
- **Minuto 2:20–3:00 (Adaptação ao Imprevisto):** O usuário sinaliza: *"Hoje estou exausto, não consigo fazer 30 min"*. O sistema reajusta na hora o plano para um micro-desafio de 7 minutos, preservando o progresso sem culpa.
