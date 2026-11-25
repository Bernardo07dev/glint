# task-session-execution Specification

## Purpose

Prover a experiência de execução da sessão de estudo em `/planos/[planId]/tasks/[taskId]`, permitindo preparar o conteúdo JIT sob demanda (para planos FREE e PRO), percorrer um step por tela (`SessionStep` + `StepStage`), registrar progresso em `PlanTask.completedSteps` e concluir a sessão coletando feedback de dificuldade e anotações para calibrar a próxima aula.

## Requirements

### Requirement: Preparação Sob Demanda Direta na Rota da Sessão
Quando o aluno acessa `/planos/[planId]/tasks/[taskId]` e a `PlanTask` ainda não possui conteúdo pronto (`enrichmentStatus` em `PENDING`, `GENERATING` ou `FAILED`), a interface SHALL exibir o estado de preparação com o botão de geração sob demanda (`enrichTaskNowAction`), executando `enrichPlanTaskDirect` no servidor e renderizando a sessão assim que `content` ficar disponível.

#### Scenario: Aluno abre sessão pendente a partir da trilha do plano ou da Home
- **WHEN** o aluno clica em "Ir para sessão" (`plan-trail.tsx`) ou "Preparar sessão" (`next-task-hero.tsx`) para uma task ainda `PENDING` e aciona "Preparar sessão agora"
- **THEN** `enrichTaskNowAction` executa o pipeline JIT, exibe o `BeeLoader` durante o processamento e atualiza a tela imediatamente com os steps interativos quando `enrichmentStatus` atinge `READY`.

### Requirement: Navegação Passo a Passo e Persistência de Progresso
Durante a sessão ativa, `TaskSessionClient` SHALL renderizar um step por página via `SessionStep` e `StepStage` (mantendo o botão de avanço neutro nos steps de `active_recall_quiz` até a conclusão do quiz) e persistir cada step concluído em `PlanTask.completedSteps` com `status = "IN_PROGRESS"` via `recordStepProgressAction`.

#### Scenario: Avanço entre steps da sessão
- **WHEN** o aluno clica em "Próximo passo" em um step da sessão
- **THEN** `recordStepProgressAction` adiciona o `step.id` em `PlanTask.completedSteps`, muda `PlanTask.status` para `IN_PROGRESS` e avança o stepper para o próximo passo.

### Requirement: Fechamento da Sessão com Feedback de Dificuldade e Notas para o Próximo JIT
Ao concluir o último step da sessão, a interface SHALL apresentar a tela de fechamento para coleta de `difficultyRating` (`too_easy`, `just_right` ou `too_hard`) e `userNotes` opcional, persistindo a conclusão via `finishTaskSessionAction` em `PlanTask` e `LearningPlan`.

#### Scenario: Finalização da sessão com avaliação de ritmo e anotação
- **WHEN** o aluno seleciona a dificuldade percebida, preenche uma anotação opcional e clica em "Finalizar e voltar ao plano"
- **THEN** `finishTaskSessionAction` atualiza `PlanTask` (`status = "COMPLETED"`, `completedAt`, `difficultyRating`, `userNotes`), sincroniza `LearningPlan.planStructure` e `completedTasks` (marcando `stage = "COMPLETED"` se todas as tasks foram concluídas) e redireciona para `/planos/[planId]`.
