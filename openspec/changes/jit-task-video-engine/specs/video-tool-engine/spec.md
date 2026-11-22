# Spec: `video-tool-engine`

## Purpose

Definir o comportamento do motor da tool `video` (Fase 1: YouTube) para buscar vídeos didáticos reais, filtrar candidatos inválidos, recortar a janela de tempo pela transcrição e validar alinhamento com o objetivo da task.

## ADDED Requirements

### Requirement: Busca e Filtro Determinístico de Candidatos
O motor de `video` MUST buscar candidatos no YouTube a partir de queries planejadas pelo `models.fast` e aplicar filtros determinísticos antes de acionar qualquer LLM na transcrição.

#### Scenario: Descarte de vídeos inadequados
- **WHEN** a busca retorna candidatos do YouTube
- **THEN** o motor descarta imediatamente vídeos com `durationSeconds < 120` (Shorts), `durationSeconds > 5400` (lives muito longas) ou `embeddable === false`.

### Requirement: Recorte Cirúrgico por Transcrição Timestamped
Para os candidatos aprovados no filtro determinístico, o motor SHALL extrair a transcrição com timestamps agrupada em blocos de tempo e selecionar `watchStartSeconds` e `watchEndSeconds` respeitando `consumeMinutes`.

#### Scenario: Vídeo maior que o tempo disponível do aluno
- **WHEN** o melhor vídeo possui duração maior que `consumeMinutes * 60`
- **THEN** o Segment Slicer define `watchStartSeconds` e `watchEndSeconds` de forma que `(watchEndSeconds - watchStartSeconds) <= consumeMinutes * 60`, pulando introduções irrelevantes e extraindo `keyMoments` dentro da janela.

#### Scenario: Ausência de transcrição e capítulos
- **WHEN** nenhum candidato aprovado possui transcrição legível nem capítulos detalhados na descrição
- **THEN** o motor sinaliza fallback para `concept_explainer` em vez de entregar um vídeo sem walkthrough fundamentado.

### Requirement: Validação de Alinhamento via Jev Judge
O trecho recortado (`transcriptSummary` + `keyMoments`) MUST ser validado por `checkWithJev` contra o objetivo da task antes de ser aceito em `content.tools.video`.

#### Scenario: Trecho reprovado pelo Jev Judge
- **WHEN** `checkWithJev` retorna `passed: false` para o trecho selecionado
- **THEN** o motor tenta o próximo candidato/query ou aciona o fallback para `concept_explainer`.
