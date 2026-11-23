"use client";

import "katex/dist/katex.min.css";
import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { MermaidBlock } from "./mermaid-block";

function extractMermaid(children: ReactNode): string | null {
  if (!isValidElement(children)) return null;
  const props = children.props as { className?: string; children?: ReactNode };
  if (typeof props.className === "string" && props.className.includes("language-mermaid")) {
    const text = Array.isArray(props.children) ? props.children.join("") : props.children;
    return typeof text === "string" ? text : String(text ?? "");
  }
  return null;
}

export function RichMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="rich-markdown max-w-[72ch] space-y-4 font-sans text-sm leading-[1.65] text-[#2D3142]/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeHighlight, { detect: false }], rehypeKatex]}
        components={{
          pre({ children }) {
            const mermaid = extractMermaid(children);
            if (mermaid !== null) return <MermaidBlock chart={mermaid} />;
            return (
              <pre className="overflow-x-auto rounded-xl border border-[#2D3142]/10 bg-[#2D3142]/[0.04] px-4 py-3 text-[13px] leading-relaxed [&_.hljs-comment]:text-[#646B82] [&_.hljs-keyword]:text-[#3E6FD6] [&_.hljs-string]:text-[#2B6E47] [&_.hljs-number]:text-[#C4553F] [&_.hljs-title]:text-[#3E6FD6] [&_.hljs-attr]:text-[#2B6E47] [&_.hljs-built_in]:text-[#C4553F]">
                {children}
              </pre>
            );
          },
          code({ className, children }) {
            if (className) return <code className={className}>{children}</code>;
            return (
              <code className="rounded-md bg-[#F3EFE6] px-1.5 py-0.5 font-mono text-[0.85em] text-[#2D3142]">
                {children}
              </code>
            );
          },
          h2({ children }) {
            return (
              <h2 className="font-display pt-3 text-xl font-medium tracking-tight text-[#2D3142]">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="font-display pt-2 text-base font-medium tracking-tight text-[#2D3142]">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="pt-1 text-sm font-medium text-[#2D3142]">{children}</h4>
            );
          },
          p({ children }) {
            return <p className="leading-[1.65]">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc space-y-1.5 pl-5 marker:text-[#5B8DEF]">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal space-y-1.5 pl-5 marker:text-[#5B8DEF]">{children}</ol>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="rounded-r-xl border-l-2 border-[#FF9B85] bg-[#FFF0E5]/60 px-4 py-3 text-[#2D3142]/80">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto rounded-xl border border-[#2D3142]/10">
                <table className="w-full text-left text-[13px]">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-[#F3EFE6] text-xs font-medium text-[#2D3142]">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-3.5 py-2.5 font-medium">{children}</th>;
          },
          td({ children }) {
            return <td className="border-t border-[#2D3142]/8 px-3.5 py-2.5 align-top">{children}</td>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3E6FD6] underline decoration-[#3E6FD6]/30 underline-offset-2 hover:decoration-[#3E6FD6] cursor-pointer"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="border-[#2D3142]/10" />;
          },
          strong({ children }) {
            return <strong className="font-medium text-[#2D3142]">{children}</strong>;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
