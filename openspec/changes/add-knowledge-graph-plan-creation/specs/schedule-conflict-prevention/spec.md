# Spec Delta

## Purpose

Impede que sessões de um novo plano de aprendizado sejam agendadas em dias e horários já reservados por outros planos ativos do mesmo usuário, tanto na geração da estrutura quanto no aceite do plano.

## ADDED Requirements

### Requirement: Agenda ocupada na geração do plano

O sistema MUST considerar os horários já reservados pelos planos ativos do usuário ao gerar a estrutura de um novo plano, evitando alocar sessões nos mesmos dias da semana e horários.

#### Scenario: Usuário com plano ativo

- **WHEN** a estrutura de um novo plano é gerada para um usuário que possui outro plano ativo com sessões recorrentes em determinados dias e horários
- **THEN** a estrutura gerada não aloca sessões nos dias e horários já reservados pelo plano ativo

#### Scenario: Usuário sem plano ativo

- **WHEN** a estrutura de um novo plano é gerada para um usuário sem nenhum plano ativo
- **THEN** a estrutura é gerada apenas a partir da disponibilidade informada pelo aluno, sem restrições adicionais

### Requirement: Visibilidade de horários ocupados na coleta da rotina

O sistema MUST exibir, na pergunta de seleção de rotina (`schedule_picker` do step `routine_and_slots`), os horários já reservados por outros planos do usuário, e MUST impedir o envio de uma rotina que contenha sessões sobrepostas a esses horários.

#### Scenario: Visualização dos horários reservados

- **WHEN** a pergunta de seleção de rotina é exibida para um usuário com planos que já reservam dias e horários
- **THEN** os horários ocupados são indicados por dia na interface de seleção

#### Scenario: Tentativa de rotina conflitante

- **WHEN** o usuário tenta confirmar uma rotina contendo uma sessão que se sobrepõe a um horário já reservado
- **THEN** o envio é bloqueado com uma mensagem indicando o dia, o horário e a faixa já reservada, permitindo a correção antes de prosseguir

### Requirement: Validação de conflito no aceite do plano

O sistema MUST rejeitar o aceite de um plano cuja agenda gerada conflite com as sessões de outros planos ativos do mesmo usuário, informando o conflito ao usuário e permitindo ajuste do plano.

#### Scenario: Aceite sem conflito

- **WHEN** o usuário aceita um plano cuja agenda não se sobrepõe às sessões de nenhum outro plano ativo
- **THEN** o aceite é processado normalmente e o plano é ativado

#### Scenario: Aceite com conflito de agenda

- **WHEN** o usuário tenta aceitar um plano cuja agenda se sobrepõe às sessões de outro plano ativo (mesmo dia da semana e faixa de horário)
- **THEN** o aceite é rejeitado com uma mensagem indicando o conflito, o plano não é ativado e o usuário pode solicitar um ajuste do cronograma
