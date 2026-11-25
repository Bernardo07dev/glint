# Spec Delta

## Purpose

Mantém um contexto acumulado do aluno (knowledge graph leve) derivado de seus planos e interações anteriores, e o injeta nas etapas de criação de um novo plano para personalizar o refinamento do objetivo e o meta-plano.

## ADDED Requirements

### Requirement: Persistência do contexto do aluno

O sistema MUST manter, por usuário, um contexto de aprendizado consolidado contendo informações relevantes de planos anteriores (objetivos, domínios estudados, perfil coletado nas entrevistas e sinais de progresso), atualizado quando um plano é criado ou concluído.

#### Scenario: Atualização após criação de plano

- **WHEN** um plano de aprendizado do usuário conclui a etapa de entrevista e gera a estrutura do plano
- **THEN** o contexto do aluno é atualizado incorporando o objetivo refinado e o perfil coletado na entrevista daquele plano

#### Scenario: Usuário sem histórico

- **WHEN** um usuário sem nenhum plano anterior inicia a criação de um plano
- **THEN** o sistema prossegue normalmente sem contexto prévio, sem erro

### Requirement: Injeção do contexto na criação de plano

O sistema MUST fornecer o contexto acumulado do aluno às etapas de refinamento do objetivo e de geração do meta-plano sempre que o contexto existir e não estiver vazio.

#### Scenario: Plano com contexto disponível

- **WHEN** um usuário que já possui contexto de aprendizado inicia a criação de um novo plano
- **THEN** as etapas de refinamento do objetivo e do meta-plano recebem o contexto do aluno para personalizar perguntas e passos investigativos

#### Scenario: Contexto ausente ou vazio

- **WHEN** o contexto do aluno não existe ou está vazio
- **THEN** as etapas de criação do plano executam sem contexto adicional, no comportamento atual
