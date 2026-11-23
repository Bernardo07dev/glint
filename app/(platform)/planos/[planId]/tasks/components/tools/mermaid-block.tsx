"use client";

import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose",
  flowchart: { htmlLabels: true, curve: "basis" },
  themeVariables: {
    primaryColor: "#E8F0FE",
    primaryBorderColor: "#5B8DEF",
    primaryTextColor: "#2D3142",
    secondaryColor: "#FFF0E5",
    secondaryBorderColor: "#FF9B85",
    secondaryTextColor: "#2D3142",
    tertiaryColor: "#F3EFE6",
    tertiaryBorderColor: "#646B82",
    tertiaryTextColor: "#2D3142",
    noteBkgColor: "#FFF0E5",
    noteBorderColor: "#FF9B85",
    noteTextColor: "#2D3142",
    lineColor: "#646B82",
    textColor: "#2D3142",
    mainBkg: "#E8F0FE",
    nodeBorder: "#5B8DEF",
    clusterBkg: "#FFFDF8",
    clusterBorder: "#F3EFE6",
    edgeLabelBackground: "#FFFDF8",
    actorBkg: "#E8F0FE",
    actorBorder: "#5B8DEF",
    actorTextColor: "#2D3142",
    actorLineColor: "#646B82",
    signalColor: "#2D3142",
    signalTextColor: "#2D3142",
    labelBoxBkgColor: "#FFF0E5",
    labelBoxBorderColor: "#FF9B85",
    labelTextColor: "#2D3142",
    loopTextColor: "#2D3142",
    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
  },
});

export function MermaidBlock({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    mermaid
      .render(`mmd${rawId}`, chart.trim())
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [chart, rawId]);

  if (failed) {
    return (
      <pre className="overflow-x-auto rounded-xl bg-[#F3EFE6] px-4 py-3 text-xs leading-relaxed text-[#2D3142]/80">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="mermaid-diagram my-2 flex justify-center overflow-x-auto rounded-2xl border border-[#5B8DEF]/15 bg-white px-4 py-5 [&_svg]:max-w-full"
    />
  );
}
