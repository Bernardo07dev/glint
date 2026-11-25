# Proposal

## Why

Os agentes `refining-goal` e `meta-plan` já aceitam um parâmetro `knowledgeGraph`, mas o router em `app/api/plan/route.ts` nunca o fornece — hoje todo plano é criado como se o usuário fosse um desconhecido, ignorando planos anteriores, nível e estilo de aprendizado já mapeados. Além disso, nada impede que um novo plano seja agendado nos mesmos dias/horários de um plano já ativo, gerando sessões sobrepostas no calendário do aluno (card Trello `Y4Zb8js2`).

## What Changes

- Criar uma fonte de **contexto do aluno** (knowledge graph leve): resumo derivado dos planos anteriores do usuário (objetivos, etapas concluídas, feedbacks de dificuldade e perfil coletado nas entrevistas), persistido no `User` e atualizado ao final de cada entrevista de criação de plano.
- Injetar esse contexto nas chamadas dos agentes `refining-goal` e `meta-plan` no router `app/api/plan/route.ts`, ativando o parâmetro `knowledgeGraph` já existente.
- Passar a **agenda ocupada** (slots de `routineContract` dos planos ativos) para o agente `generating-tasks`, para que o cronograma gerado evite horários já reservados.
- Validar no handler `accept-plan` que nenhum slot da nova `planStructure` conflita com os slots de planos ativos do mesmo usuário; em caso de conflito, rejeitar o aceite com mensagem clara e permitir novo ajuste via `adjust_plan`.

## Capabilities

### New Capabilities

- `learner-context`: coleta, persistência e injeção do contexto acumulado do aluno (knowledge graph) nas etapas de criação de plano (refinamento do objetivo e meta-plano).
- `schedule-conflict-prevention`: garantia de que um plano de aprendizado não agenda sessões em dias/horários já reservados por outros planos ativos do mesmo usuário, tanto na geração quanto no aceite do plano.

### Modified Capabilities

<!-- Nenhuma capability existente em openspec/specs — o diretório está vazio. -->

## Impact

- **Banco de dados (`prisma/schema.prisma`)**: novo campo no `User` para persistir o contexto do aluno (ex.: `knowledgeGraph Json?` ou `String?`), com migration obrigatória.
- **API**: `app/api/plan/route.ts` passa a carregar contexto do aluno e agenda ocupada; `app/api/plan/handlers/accept-plan.ts` ganha validação de conflito.
- **Agentes (`lib/agents/`)**: `generating-tasks.ts` (e types/prompts) recebe slots ocupados como entrada adicional.
- **Lib**: nova função de domínio (ex.: `lib/learner-context.ts`) para montar/atualizar o knowledge graph a partir de `LearningPlan`, `PlanMessage` e `PlanTask`.
- **UX**: novo erro de conflito de agenda exibido no fluxo de criação (`criacao-plano`), permitindo ajuste do plano.
- **Fora de escopo**: grafo de conhecimento rico/estruturado por domínio (card `nps5jJga`, Future Goal), motor de busca do YouTube e gamificação.
