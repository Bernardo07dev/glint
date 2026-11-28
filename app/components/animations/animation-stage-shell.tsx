"use client";

import { useEffect, useState, type ReactNode } from "react";

interface AnimationStageShellProps {
  headline: string;
  ariaLabel: string;
  bgBase?: string;
  haloPrimary: string;
  haloSecondary: string;
  haloCenter?: string;
  topLeftAction?: ReactNode;
  isExiting?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Palco Full-Screen (100dvh) padronizado (steering/DYNAMIC_ANIMATIONS.md):
 * - Mais de 75% do centro da tela livre para a coreografia vetorial
 * - Halos Aquarela Viva em camadas de profundidade
 * - Balão de Fala editorial em Fraunces no topo apontando para a Abelhinha abaixo
 * - Saída fluida Curtain Reveal via `isExiting`
 */
export function AnimationStageShell({
  headline,
  ariaLabel,
  bgBase = "#FFFDF8",
  haloPrimary,
  haloSecondary,
  haloCenter = "#FFE07D",
  topLeftAction,
  isExiting = false,
  className = "",
  children,
}: AnimationStageShellProps) {
  const [textRevealed, setTextRevealed] = useState(false);

  useEffect(() => {
    setTextRevealed(false);
    const timer = setTimeout(() => setTextRevealed(true), 110);
    return () => clearTimeout(timer);
  }, [headline]);

  const words = headline.split(" ");

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={`relative h-dvh w-full overflow-hidden select-none transition-all duration-500 ease-out ${
        isExiting ? "opacity-0 scale-[1.02]" : "opacity-100 scale-100"
      } ${className}`}
      style={{ backgroundColor: bgBase }}
    >
      {/* Camadas Aquarela Viva em Full-Viewport */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 -left-20 h-[62vh] w-[62vh] rounded-full blur-3xl transition-colors duration-700"
          style={{
            backgroundColor: haloPrimary,
            opacity: 0.58,
          }}
        />
        <div
          className="absolute -bottom-28 -right-16 h-[68vh] w-[68vh] rounded-full blur-3xl transition-colors duration-700"
          style={{
            backgroundColor: haloSecondary,
            opacity: 0.7,
          }}
        />
        <div
          className="absolute top-[38%] left-1/2 h-[52vh] w-[68vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors duration-700"
          style={{
            backgroundColor: haloCenter,
            opacity: 0.28,
          }}
        />
      </div>

      {/* Ação superior esquerda opcional (ex: botão Voltar durante polling do plano) */}
      {topLeftAction && (
        <div className="absolute top-5 left-5 z-20">{topLeftAction}</div>
      )}

      {/* Balão de Fala da Abelhinha no topo (sem borda artificial no texto e sem sobrepor as antenas) */}
      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-xl flex-col items-center px-6 pt-5 text-center sm:pt-7">
        <div className="relative rounded-3xl bg-[#FFFDF8] px-5 py-3.5 border-2 border-[#F3EFE6] shadow-[0_10px_28px_-10px_rgba(45,49,66,0.08)]">
          <h1
            className="max-w-[34ch] font-display font-medium tracking-tight text-[#2D3142]"
            style={{
              fontSize: "clamp(1.05rem, 1.65vw, 1.45rem)",
              lineHeight: 1.3,
            }}
          >
            {words.map((word, index) => (
              <span
                key={`${headline}-${index}`}
                className="inline-block transition-all duration-500 ease-out"
                style={{
                  opacity: textRevealed ? 1 : 0,
                  transform: textRevealed
                    ? "translateY(0px)"
                    : "translateY(6px)",
                  transitionDelay: `${Math.min(index * 28, 420)}ms`,
                }}
              >
                {word}&nbsp;
              </span>
            ))}
          </h1>

          {/* Pontinha do balão apontando para a Abelhinha abaixo */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 -bottom-2.5 size-4 -translate-x-1/2 rotate-45 rounded-xs bg-[#FFFDF8] border-r-2 border-b-2 border-[#F3EFE6]"
          />
        </div>
      </div>

      {/* Palco Vetorial Full-Screen */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {children}
      </svg>
    </div>
  );
}
