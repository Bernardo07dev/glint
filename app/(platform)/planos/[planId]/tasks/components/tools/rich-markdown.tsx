"use client";

import "katex/dist/katex.min.css";
import { isValidElement, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "@gravity-ui/icons";
import { MermaidBlock } from "./mermaid-block";

function extractNodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join("");
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return extractNodeText(props.children);
  }
  return "";
}

function extractCodeMeta(children: ReactNode): {
  language: string | null;
  rawText: string;
  isMermaid: boolean;
} {
  if (!isValidElement(children)) {
    return { language: null, rawText: extractNodeText(children), isMermaid: false };
  }
  const props = children.props as { className?: string; children?: ReactNode };
  const className = typeof props.className === "string" ? props.className : "";
  const match = /language-([a-zA-Z0-9_-]+)/.exec(className);
  const language = match ? match[1].toLowerCase() : null;
  const rawText = extractNodeText(props.children);

  return {
    language,
    rawText,
    isMermaid: language === "mermaid",
  };
}

function CodeBlock({
  language,
  rawText,
  children,
}: {
  language: string | null;
  rawText: string;
  children: ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText.replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard indisponível no contexto
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-[#2D3142]/10 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-[#2D3142]/8 bg-[#F3EFE6]/75 px-4 py-2">
        <span className="font-mono text-[11px] font-medium text-[#646B82]">
          {language ?? "código"}
        </span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-[#646B82] transition-colors hover:bg-white hover:text-[#2D3142] cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3 text-[#2B6E47]" />
              <span className="text-[#2B6E47]">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-relaxed text-[#2D3142] [&_.hljs-comment]:text-[#646B82] [&_.hljs-keyword]:text-[#3E6FD6] [&_.hljs-string]:text-[#2B6E47] [&_.hljs-number]:text-[#C4553F] [&_.hljs-title]:text-[#3E6FD6] [&_.hljs-attr]:text-[#2B6E47] [&_.hljs-built_in]:text-[#C4553F]">
        {children}
      </pre>
    </div>
  );
}

export function RichMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="rich-markdown w-full space-y-4 font-sans text-sm leading-[1.7] text-[#2D3142]/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeHighlight, { detect: false }], rehypeKatex]}
        components={{
          pre({ children }) {
            const { language, rawText, isMermaid } = extractCodeMeta(children);
            if (isMermaid) return <MermaidBlock chart={rawText} />;
            return (
              <CodeBlock language={language} rawText={rawText}>
                {children}
              </CodeBlock>
            );
          },
          code({ className, children }) {
            if (className) return <code className={className}>{children}</code>;
            return (
              <code className="rounded-md border border-[#2D3142]/8 bg-[#F3EFE6]/80 px-1.5 py-0.5 font-mono text-[0.85em] text-[#2D3142]">
                {children}
              </code>
            );
          },
          h2({ children }) {
            return (
              <h2 className="font-display pt-4 text-lg sm:text-xl font-medium tracking-tight text-[#2D3142]">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="font-display pt-3 text-base sm:text-[17px] font-medium tracking-tight text-[#2D3142]">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="pt-2 text-sm font-semibold text-[#2D3142]">
                {children}
              </h4>
            );
          },
          p({ children }) {
            return <p className="max-w-[78ch] leading-[1.7]">{children}</p>;
          },
          ul({ children }) {
            return (
              <ul className="max-w-[78ch] list-disc space-y-2 pl-5 marker:text-[#5B8DEF]">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="max-w-[78ch] list-decimal space-y-2 pl-5 marker:font-semibold marker:text-[#5B8DEF]">
                {children}
              </ol>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-4 max-w-[78ch] rounded-r-2xl border-l-[3px] border-[#FF9B85] bg-[#FFF0E5]/75 px-4 py-3.5 text-[13px] leading-[1.65] text-[#2D3142]/90">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-2xl border border-[#2D3142]/10 bg-white">
                <table className="w-full text-left text-[13px]">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-[#F3EFE6]/85 text-xs font-semibold text-[#2D3142]">
                {children}
              </thead>
            );
          },
          th({ children }) {
            return <th className="px-4 py-3 font-semibold">{children}</th>;
          },
          td({ children }) {
            return (
              <td className="border-t border-[#2D3142]/8 px-4 py-3 align-top leading-[1.6]">
                {children}
              </td>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#3E6FD6] underline decoration-[#3E6FD6]/30 underline-offset-2 hover:decoration-[#3E6FD6] cursor-pointer"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="my-6 border-[#2D3142]/8" />;
          },
          strong({ children }) {
            return (
              <strong className="font-semibold text-[#2D3142]">{children}</strong>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
