"use client";

import { ArrowUpRightFromSquare, BookOpen, Clock, Link as LinkIcon } from "@gravity-ui/icons";
import { RichMarkdown } from "./rich-markdown";
import type { ConceptExplainerData } from "./types";

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ConceptExplainer({ explainer }: { explainer: ConceptExplainerData }) {
  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D3142]/8 pb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#5B8DEF]">
            <BookOpen className="size-4" />
          </span>
          <h3 className="font-display text-lg sm:text-xl font-medium leading-snug text-[#2D3142]">
            {explainer.title}
          </h3>
        </div>

        {typeof explainer.estimatedReadMinutes === "number" && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F3EFE6] px-2.5 py-1 text-xs font-medium tabular-nums text-[#646B82]">
            <Clock className="size-3.5" />
            <span>~{explainer.estimatedReadMinutes} min de leitura</span>
          </span>
        )}
      </header>

      <RichMarkdown markdown={explainer.markdown} />

      {explainer.sources && explainer.sources.length > 0 && (
        <footer className="space-y-2.5 border-t border-[#2D3142]/8 pt-5">
          <p className="text-xs font-semibold text-[#646B82]">
            Referências consultadas
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {explainer.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-xl border border-[#2D3142]/8 bg-white px-3.5 py-2.5 transition-colors hover:border-[#5B8DEF]/35 hover:bg-[#E8F0FE]/30 cursor-pointer"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#F3EFE6] text-[#646B82] transition-colors group-hover:bg-[#E8F0FE] group-hover:text-[#3E6FD6]">
                      <LinkIcon className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium text-[#2D3142]">
                        {source.title}
                      </span>
                      <span className="block truncate text-[11px] text-[#646B82]">
                        {getDomain(source.url)}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRightFromSquare className="size-3.5 shrink-0 text-[#646B82]/70 transition-colors group-hover:text-[#3E6FD6]" />
                </a>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}
