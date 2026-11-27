import { generateText, Output } from "ai";
import { z } from "zod";
import { BASE_SYSTEM_PROMPT } from "@/lib/agents/prompts";
import { models } from "@/lib/infra/llm";
import {
  ConceptExplainerSchema,
  type ConceptExplainerData,
  type ConceptExplainerSource,
} from "@/lib/tasks/task-content";
import {
  formatLearnerProfileSummary,
  formatPreviousFeedbackSummary,
  type StepAgentTaskContext,
  type StepBlueprintItem,
} from "./types";

import {
  getHostnameLabel,
  normalizeHttpUrl,
  searchWebWithFirecrawlV2,
} from "@/lib/infra/firecrawl";

const ConceptExplainerLlmSchema = z.object({
  title: z.string().min(1),
  estimatedReadMinutes: z.number().int().positive(),
  markdown: z.string().min(1),
  usedSourceUrls: z.array(z.string()),
});

/**
 * Tool 2 (`concept_explainer`): researches up-to-date docs via Firecrawl v2
 * (`/v2/search`) and synthesizes a rich editorial Markdown guide (with Mermaid
 * diagrams, GFM tables, code blocks, and KaTeX) formatted for `RichMarkdown`.
 */
export async function runConceptExplainerStepAgent({
  context,
  step,
}: {
  context: StepAgentTaskContext;
  step: StepBlueprintItem;
}): Promise<ConceptExplainerData> {
  const searchQuery = `${context.searchQueryUsed || context.title} ${step.goal}`.slice(
    0,
    180,
  );
  const scrapedDocs = await searchWebWithFirecrawlV2(searchQuery);

  const sourcesContext =
    scrapedDocs.length > 0
      ? scrapedDocs
          .map(
            (doc, idx) =>
              `### Fonte ${idx + 1}: ${doc.title}\nURL: ${doc.url}\nConteúdo extraído:\n${doc.markdown}`,
          )
          .join("\n\n---\n\n")
      : "Nenhuma fonte externa retornada pelo Firecrawl nesta execução; sintetize o guia técnico completo usando seu conhecimento validado sem inventar URLs.";

  const learnerProfile = formatLearnerProfileSummary(context.executableMeta);
  const previousFeedback = formatPreviousFeedbackSummary(context.previousFeedback);

  const { output } = await generateText({
    model: models.architect,
    output: Output.object({
      schema: ConceptExplainerLlmSchema,
      name: "ConceptExplainerGuide",
      description:
        "Guia didático rico em Markdown (com Mermaid, tabelas GFM e blocos de código) alinhado ao objetivo do step.",
    }),
    system: `${BASE_SYSTEM_PROMPT}

Você é o autor editorial da tool "concept_explainer" do Glint.
Escreva um guia didático completo, claro e prático em português brasileiro para renderização no componente RichMarkdown.

Diretrizes obrigatórias de formatação e qualidade:
1. Estrutura limpa: use subtítulos (## / ###), parágrafos diretos e objetivos (evite blocos prolixos), listas acionáveis e callouts (> Nota / > Atenção) quando agregarem valor real.
2. Diagrama Mermaid: sempre que um fluxo, arquitetura ou tomada de decisão ficar mais clara visualmente, inclua um bloco \`\`\`mermaid (apenas \`flowchart LR\`, \`flowchart TD\`, \`sequenceDiagram\` ou \`stateDiagram-v2\`).
   - REGRA CRÍTICA DE MERMAID: todo rótulo com parênteses, colchetes ou caracteres especiais DEVE estar entre aspas duplas, ex.: \`A["Passo 1 (Setup)"] --> B["Execução"]\`. Nunca use tags HTML dentro de nós Mermaid.
3. Tabela comparativa GFM: inclua pelo menos 1 tabela Markdown comparando abordagens, "O que fazer vs. O que evitar" ou referência rápida de comandos/conceitos.
4. Código e fórmulas: use blocos \`\`\`linguagem explícitos (ex.: \`\`\`bash, \`\`\`ts, \`\`\`python) e KaTeX ($...$) apenas quando houver fórmulas reais.
5. Fontes: em "usedSourceUrls", liste APENAS URLs exatas fornecidas nas fontes pesquisadas acima (ou array vazio [] se nenhuma foi fornecida). Nunca invente ou chute URLs.
6. Zero pontos de exclamação, zero clichês motivacionais.`,
    prompt: `Objetivo macro do plano: "${context.refinedGoal}"
Sessão #${context.order}: "${context.title}"
Por que importa: ${context.whyItMatters}
Objetivo deste step: "${step.goal}"
Tempo estimado de leitura/prática: ${step.estimatedMinutes} min

Perfil do aluno:
${learnerProfile}

Feedback da sessão anterior:
${previousFeedback}

Fontes da web (Firecrawl v2):
${sourcesContext}`,
  });

  const byUrl = new Map(scrapedDocs.map((doc) => [doc.url, doc]));
  const verifiedSources: ConceptExplainerSource[] = [];

  for (const url of output.usedSourceUrls) {
    const valid = normalizeHttpUrl(url);
    if (!valid) continue;
    const matched = byUrl.get(valid);
    if (matched && !verifiedSources.some((s) => s.url === matched.url)) {
      verifiedSources.push({ title: matched.title, url: matched.url });
    }
  }

  const finalSources =
    verifiedSources.length > 0
      ? verifiedSources
      : scrapedDocs.map(({ title, url }) => ({ title, url }));

  return ConceptExplainerSchema.parse({
    title: output.title.trim(),
    estimatedReadMinutes: Math.max(
      1,
      Math.round(output.estimatedReadMinutes || step.estimatedMinutes),
    ),
    markdown: output.markdown.trim(),
    ...(finalSources.length > 0 ? { sources: finalSources } : {}),
  });
}
