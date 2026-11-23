"use client";

import { Link as LinkIcon } from "@gravity-ui/icons";
import { RichMarkdown } from "./rich-markdown";
import type { ConceptExplainerData } from "./types";

export function ConceptExplainer({ explainer }: { explainer: ConceptExplainerData }) {
  return (
    <article className="space-y-5">
      <header className="flex items-baseline justify-between gap-4 border-b border-[#2D3142]/8 pb-3">
        <p className="text-sm font-medium text-[#2D3142]">{explainer.title}</p>
        {typeof explainer.estimatedReadMinutes === "number" && (
          <span className="shrink-0 text-xs tabular-nums text-[#646B82]">
            ~{explainer.estimatedReadMinutes} min de leitura
          </span>
        )}
      </header>

      <RichMarkdown markdown={explainer.markdown} />

      {explainer.sources && explainer.sources.length > 0 && (
        <footer className="space-y-2 rounded-2xl bg-[#F3EFE6]/60 px-4 py-3.5">
          <p className="text-xs font-medium text-[#646B82]">Fontes consultadas</p>
          <ul className="space-y-1">
            {explainer.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#3E6FD6] hover:underline cursor-pointer"
                >
                  <LinkIcon className="size-3.5" />
                  <span>{source.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}
