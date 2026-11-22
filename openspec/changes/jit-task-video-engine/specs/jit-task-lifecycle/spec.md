# Spec: `jit-task-lifecycle`

## Purpose

Definir o ciclo de vida Just-In-Time (JIT) das sessões de estudo (`PlanTask`), garantindo que o conteúdo pedagógico seja gerado apenas sob demanda e siga estritamente a ordem `Tool → Walkthrough`.

## ADDED Requirements

### Requirement: Persistência de Esqueleto em PlanTask
Ao finalizar ou ajustar a geração do plano (`GENERATING_TASKS`), o sistema MUST persistir cada sessão como um registro independente na tabela `PlanTask` com `enrichmentStatus = PENDING`.

#### Scenario: Plano recém-gerado
- **WHEN** `handleGeneratingTasksStage` conclui a compilação do esqueleto do plano
- **THEN** o sistema cria os registros `PlanTask` ordenados (`1..N`) com `enrichmentStatus = PENDING`, `status = AVAILABLE` para `order === 1` e `status = LOCKED` para `order > 1`.

#### Scenario: Ajuste do plano pelo aluno
- **WHEN** o aluno solicita ajustes (`action: "adjust_plan"`) antes de aceitar o plano
- **THEN** o sistema substitui/atualiza os registros `PlanTask` do plano de forma idempotente mantendo `enrichmentStatus = PENDING`.

### Requirement: Geração Just-In-Time (JIT) Sob Demanda
O sistema SHALL enriquecer uma `PlanTask` apenas quando ela for acessada para execução (ou pré-aquecida na véspera/dia agendado), evitando gasto antecipado de tokens em tasks futuras.

#### Scenario: Abertura de uma task pendente
- **WHEN** o aluno abre uma `PlanTask` com `enrichmentStatus = PENDING`
- **THEN** o sistema transiciona `enrichmentStatus` para `GENERATING`, executa o agente JIT (lendo `difficultyRating` e `userNotes` da task anterior, se existir) e salva o resultado em `PlanTask.content` com `enrichmentStatus = READY`.

#### Scenario: Task já enriquecida
- **WHEN** o aluno abre uma `PlanTask` com `enrichmentStatus = READY`
- **THEN** o sistema retorna `PlanTask.content` diretamente do banco sem acionar LLMs.

### Requirement: Contrato `Tool → Walkthrough`
O conteúdo gerado em `PlanTask.content` MUST conter o dicionário `tools` resolvido antes da lista de `steps`, e cada `step` MUST possuir um `walkthrough` passo a passo ancorado na `toolRef` correspondente.

#### Scenario: Síntese de steps após resolução da tool
- **WHEN** o agente JIT conclui a resolução das tools em `requiredTools`
- **THEN** cada item em `content.steps` referencia uma chave existente em `content.tools` (`toolRef`) e inclui `walkthrough` com instruções acionáveis específicas daquele recurso.
