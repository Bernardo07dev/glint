import type { TaskContent } from "@/app/(platform)/planos/[planId]/tasks/components/tools/types";

// Fixture baseada no contrato de `PlanTask.content` (steering/TaskCreation.md)
export const fixtureContent: TaskContent = {
  tools: {
    video: {
      provider: "youtube",
      videoId: "dQw4w9WgXcQ",
      title: "Claude Code Full Setup & CLAUDE.md Guide",
      channel: "AI Engineering",
      durationSeconds: 1420,
      watchStartSeconds: 75,
      watchEndSeconds: 615,
      transcriptSummary:
        "Demonstra instalação global via npm, login OAuth e como o comando /init inspeciona o repositório para gerar o CLAUDE.md.",
      keyMoments: [
        { timestampSeconds: 75, label: "Instalação e autenticação no terminal" },
        { timestampSeconds: 240, label: "Executando /init e anatomia do CLAUDE.md" },
        { timestampSeconds: 480, label: "Regras de arquitetura vs. comandos de lint/test" },
      ],
    },
    concept_explainer: {
      title: "Anatomia de um CLAUDE.md Eficiente",
      estimatedReadMinutes: 6,
      markdown: `## Como o Claude Code carrega contexto

O arquivo \`CLAUDE.md\` na raiz do repositório funciona como a **memória permanente do agente**. A cada sessão iniciada, ele é injetado no prompt base — o que significa que cada linha custa atenção do modelo.

\`\`\`mermaid
flowchart LR
  A["Sessão iniciada"] --> B["Leitura do CLAUDE.md"]
  B --> C["Execução com comandos e regras"]
  C --> D{"Arquivo enxuto?"}
  D -->|"Sim"| E["Contexto preciso"]
  D -->|"Não"| F["Atenção diluída"]
\`\`\`

### O que colocar vs. o que evitar

| Seção | O que colocar | O que evitar |
| :--- | :--- | :--- |
| **Comandos** | \`npm test\`, \`npm run lint\` | Descrições longas de pacotes |
| **Arquitetura** | Pastas-chave e padrões | Copiar documentação inteira |
| **Regras** | Convenções que o agente deve seguir | Preferências vagas sem ação |

> O CLAUDE.md deve ser enxuto e acionável: comandos de build/test e convenções de código, pois entra no contexto de todas as tarefas.

### Exemplo mínimo

\`\`\`markdown
# Projeto Glint
- Build: npm run build
- Testes: npm test
- Lint: npm run lint

## Convenções
- Server Actions em app/actions/
- Componentes client marcados com "use client"
\`\`\`

### O custo do contexto

Se o arquivo tem $N$ linhas e cada linha custa em média $t$ tokens, o custo fixo por sessão é $C = N \\cdot t$. Mantendo $N$ pequeno, sobra mais janela para o problema real.
`,
      sources: [
        {
          title: "Claude Code Documentation — Memory & CLAUDE.md",
          url: "https://docs.anthropic.com/en/docs/claude-code/memory",
        },
        {
          title: "Anthropic Engineering — Best practices for agentic coding",
          url: "https://www.anthropic.com/engineering/claude-code-best-practices",
        },
      ],
    },
    active_recall_quiz: {
      questions: [
        {
          id: "q_01",
          question:
            "Qual é o principal impacto de manter arquivos extensos ou regras vagas dentro do CLAUDE.md?",
          options: [
            {
              id: "opt_a",
              text: "O arquivo é ignorado automaticamente se passar de 50 linhas.",
              explanation:
                "Incorreto. O Claude Code não ignora o arquivo por limite de linhas — ele carrega todo o conteúdo no contexto.",
            },
            {
              id: "opt_b",
              text: "Consome janela de contexto em toda interação e dilui a atenção do agente nas regras críticas.",
              explanation:
                "Correto. Como o CLAUDE.md é injetado no prompt base da sessão, textos prolixos aumentam o gasto de tokens e reduzem a precisão.",
            },
            {
              id: "opt_c",
              text: "Impede a execução de comandos bash locais.",
              explanation:
                "Incorreto. Permissões de bash são controladas pelas configurações de ferramenta, não pelo tamanho do CLAUDE.md.",
            },
          ],
          correctOptionId: "opt_b",
          explanation:
            "O CLAUDE.md deve ser enxuto e acionável (comandos de build/test e convenções de código), pois entra no contexto de todas as tarefas.",
        },
        {
          id: "q_02",
          question:
            "Um aluno quer colocar no CLAUDE.md a explicação completa de como o Next.js renderiza páginas. Qual é a melhor decisão?",
          options: [
            {
              id: "opt_a",
              text: "Incluir a explicação completa, pois mais contexto sempre ajuda o agente.",
              explanation:
                "Incorreto. Contexto educacional genérico não muda o comportamento do agente e compete por atenção com as regras reais.",
            },
            {
              id: "opt_b",
              text: "Substituir a explicação por uma convenção acionável, como 'Server Components por padrão; \"use client\" só quando houver estado'.",
              explanation:
                "Correto. Regras acionáveis direcionam o comportamento do agente sem desperdiçar contexto.",
            },
            {
              id: "opt_c",
              text: "Mover a explicação para um comentário no package.json.",
              explanation:
                "Incorreto. Comentários no package.json não fazem parte do contexto injetado — a regra simplesmente se perderia.",
            },
          ],
          correctOptionId: "opt_b",
          explanation:
            "CLAUDE.md é um arquivo de diretrizes operacionais, não de documentação teórica. Cada item deve mudar o que o agente faz.",
        },
        {
          id: "q_03",
          question:
            "Depois de rodar /init, qual é o próximo passo recomendado para um CLAUDE.md eficiente?",
          options: [
            {
              id: "opt_a",
              text: "Aceitar o arquivo gerado sem revisar, pois ele já está otimizado.",
              explanation:
                "Incorreto. O /init gera um ponto de partida genérico — a revisão é justamente o que adapta o arquivo ao seu repositório.",
            },
            {
              id: "opt_b",
              text: "Adicionar toda a documentação do README para complementar o arquivo.",
              explanation:
                "Incorreto. Duplicar o README infla o contexto sem ganho de comportamento.",
            },
            {
              id: "opt_c",
              text: "Enxugar o arquivo mantendo apenas comandos de verificação e convenções críticas do projeto.",
              explanation:
                "Correto. O valor do CLAUDE.md está em ser curto, verificável e específico do repositório.",
            },
          ],
          correctOptionId: "opt_c",
          explanation:
            "O /init é o ponto de partida; a edição consciente é o que transforma um arquivo genérico em memória útil do projeto.",
        },
      ],
    },
  },
  steps: [
    {
      id: "step_01",
      order: 1,
      phase: "consume",
      estimatedMinutes: 10,
      toolRef: "video",
      title: "Assistir à demonstração do /init e estrutura do CLAUDE.md",
      objective:
        "Entender como o Claude Code lê o contexto do repositório sem desperdiçar tokens.",
      walkthrough: [
        "Inicie o vídeo (já posicionado em 01:15) e acompanhe a instalação e autenticação rápida até 04:00.",
        "Em 04:00, preste atenção em como o comando /init varre o package.json e a árvore de pastas.",
        "Em 08:00, observe como o autor enxuga o arquivo mantendo apenas comandos de verificação (npm test, npm run build) e convenções críticas.",
      ],
      deliverable: "Saber quais 3 seções são indispensáveis no CLAUDE.md do seu projeto.",
    },
    {
      id: "step_02",
      order: 2,
      phase: "practice",
      estimatedMinutes: 15,
      toolRef: "concept_explainer",
      title: "Analisar o guia estrutural e criar o seu CLAUDE.md",
      objective:
        "Usar o diagrama e a tabela comparativa do guia para escrever um CLAUDE.md limpo no seu projeto.",
      walkthrough: [
        "Leia o guia gerado abaixo observando o diagrama de fluxo de carregamento de contexto.",
        "Compare a tabela 'O que colocar vs. O que evitar' com a estrutura atual do seu repositório.",
        "Rode /init no seu terminal e edite o arquivo resultante aplicando as 3 seções recomendadas no guia.",
      ],
      deliverable: "CLAUDE.md salvo e enxuto na raiz do seu repositório.",
    },
    {
      id: "step_03",
      order: 3,
      phase: "practice",
      estimatedMinutes: 5,
      toolRef: "active_recall_quiz",
      title: "Validar fixação sobre memória e contexto",
      objective:
        "Confirmar que você domina os critérios de boas práticas antes de avançar.",
      walkthrough: [
        "Responda às perguntas do quiz sem consultar as anotações.",
        "Leia a explicação detalhada de cada alternativa para consolidar o conceito.",
      ],
      deliverable: "Quiz concluído com compreensão das justificativas.",
    },
  ],
};
