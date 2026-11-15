"use client";

import { useEffect, useId, useRef } from "react";

interface BeeLoaderProps {
  label?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

/**
 * Animação oficial de loading do Glint:
 * A abelhinha de perfil voa em movimento contínuo e orgânico, emitindo uma
 * onda real pela cauda (linha Cobalto Pastel #5B8DEF + rastro pontilhado Pêssego Coral #FF9B85)
 * acompanhada de estrelas Manteiga Solar (#FFE07D).
 */
export function BeeLoader({
  label = "Preparando sua jornada",
  sublabel,
  size = "md",
  fullScreen = false,
  className = "",
}: BeeLoaderProps) {
  const uid = useId().replace(/:/g, "");
  const fadeMaskId = `bee-loader-mask-${uid}`;
  const maskGradId = `bee-loader-grad-${uid}`;

  const solidTrailRef = useRef<SVGPathElement>(null);
  const dottedTrailRef = useRef<SVGPathElement>(null);
  const beeGroupRef = useRef<SVGGElement>(null);
  const spark1Ref = useRef<SVGGElement>(null);
  const spark2Ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    let rafId = 0;
    let startTime: number | null = null;

    const beeX = 142;
    const tailOffsetX = -26;
    const trailStartX = beeX + tailOffsetX; // 116
    const trailEndX = 18;
    const trailLengthX = trailStartX - trailEndX; // 98px
    const centerY = 54;
    const amplitude = 11.5;
    const omega = 3.6; // rad/s
    const waveSpeed = 88; // px/s

    const buildWavePath = (phase: number, fromX: number, toX: number) => {
      const steps = 24;
      const dx = (toX - fromX) / steps;
      let d = "";

      for (let i = 0; i <= steps; i++) {
        const x = fromX + i * dx;
        const distFromTail = trailStartX - x;
        const localPhase = phase - (distFromTail / waveSpeed) * omega;
        const env = 0.65 + 0.35 * (1 - distFromTail / trailLengthX);
        const y = centerY + Math.sin(localPhase) * amplitude * env;

        d += `${i === 0 ? "M" : " L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      }

      return d;
    };

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const t = (now - startTime) / 1000;
      const phase = t * omega;

      const beeY = centerY + Math.sin(phase) * amplitude;
      // Inclinação suave acompanhando a derivada vertical do voo (limitada entre -20° e +8°)
      const beeAngle = -6 + Math.cos(phase) * 13;

      if (beeGroupRef.current) {
        beeGroupRef.current.setAttribute(
          "transform",
          `translate(${beeX}, ${beeY.toFixed(2)}) rotate(${beeAngle.toFixed(2)})`,
        );
      }

      if (solidTrailRef.current) {
        solidTrailRef.current.setAttribute(
          "d",
          buildWavePath(phase, trailStartX, trailStartX - 46),
        );
      }

      if (dottedTrailRef.current) {
        dottedTrailRef.current.setAttribute(
          "d",
          buildWavePath(phase, trailStartX - 18, trailEndX),
        );
        // Faz os pontos do rastro caminharem fisicamente para trás na velocidade da onda
        dottedTrailRef.current.style.strokeDashoffset = `${-(t * waveSpeed) % 11}`;
      }

      // Estrelas acompanhando a trilha de voo
      if (spark1Ref.current) {
        const s1Dist = 38;
        const s1Phase = phase - (s1Dist / waveSpeed) * omega;
        const s1Y = centerY + Math.sin(s1Phase) * amplitude - 14;
        const s1Scale = 0.85 + 0.25 * Math.sin(t * 5.2);
        spark1Ref.current.setAttribute(
          "transform",
          `translate(${trailStartX - s1Dist}, ${s1Y.toFixed(2)}) scale(${s1Scale.toFixed(2)})`,
        );
      }

      if (spark2Ref.current) {
        const s2Dist = 76;
        const s2Phase = phase - (s2Dist / waveSpeed) * omega;
        const s2Y = centerY + Math.sin(s2Phase) * amplitude * 0.75 + 13;
        const s2Scale = 0.75 + 0.25 * Math.cos(t * 4.4);
        spark2Ref.current.setAttribute(
          "transform",
          `translate(${trailStartX - s2Dist}, ${s2Y.toFixed(2)}) scale(${s2Scale.toFixed(2)})`,
        );
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const svgSizeClass =
    size === "sm"
      ? "w-32 h-16"
      : size === "lg"
        ? "w-56 h-28"
        : "w-44 h-22";

  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex flex-col items-center justify-center text-center ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 210 108"
        fill="none"
        className={svgSizeClass}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={maskGradId} x1="18" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="28%" stopColor="#FFFFFF" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
          <mask id={fadeMaskId}>
            <rect x="0" y="0" width="210" height="108" fill={`url(#${maskGradId})`} />
          </mask>
        </defs>

        <g mask={`url(#${fadeMaskId})`}>
          {/* Rastro pontilhado Pêssego Coral na cauda da onda */}
          <path
            ref={dottedTrailRef}
            d="M 98 54 Q 60 66 18 54"
            stroke="#FF9B85"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="1 10"
          />

          {/* Rastro contínuo Cobalto Pastel logo atrás da abelhinha */}
          <path
            ref={solidTrailRef}
            d="M 116 54 Q 94 46 70 54"
            stroke="#5B8DEF"
            strokeWidth="5.5"
            strokeLinecap="round"
          />

          {/* Estrela 1 Manteiga Solar flutuando na trilha */}
          <g ref={spark1Ref} transform="translate(78, 40)">
            <path
              d="M 0 -7 L 1.8 -1.8 L 7 0 L 1.8 1.8 L 0 7 L -1.8 1.8 L -7 0 L -1.8 -1.8 Z"
              fill="#FFE07D"
            />
          </g>

          {/* Estrela 2 Pêssego Coral flutuando na trilha */}
          <g ref={spark2Ref} transform="translate(40, 66)">
            <path
              d="M 0 -5.5 L 1.4 -1.4 L 5.5 0 L 1.4 1.4 L 0 5.5 L -1.4 1.4 L -5.5 0 L -1.4 -1.4 Z"
              fill="#FF9B85"
            />
          </g>
        </g>

        {/* Abelhinha de Perfil em Voo */}
        <g ref={beeGroupRef} transform="translate(142, 54) rotate(-8)">
          {/* Halo solar suave na cauda */}
          <circle cx="-18" cy="4" r="16" fill="#FFE07D" opacity="0.32" />

          {/* Asas Pistache com batida rápida */}
          <ellipse
            cx="-8"
            cy="-21"
            rx="16.5"
            ry="9.5"
            transform="rotate(-18 -8 -21)"
            fill="#95E1B0"
            className="animate-wing-beat"
          />
          <ellipse
            cx="6"
            cy="-19"
            rx="13"
            ry="7.8"
            transform="rotate(12 6 -19)"
            fill="#95E1B0"
            opacity="0.82"
            className="animate-wing-beat"
          />

          {/* Corpo cápsula Manteiga Solar */}
          <rect x="-24" y="-13" width="48" height="33" rx="16.5" fill="#FFE07D" />

          {/* Listras Cobalto Pastel */}
          <path
            d="M -8 -12.5 L -8 19.5 M 4 -12.5 L 4 19.5"
            stroke="#5B8DEF"
            strokeWidth="6"
          />

          {/* Olhinho de perfil com brilho */}
          <circle cx="15" cy="0.5" r="3.9" fill="#2D3142" />
          <circle cx="16.4" cy="-0.9" r="1.4" fill="#FFFDF8" />

          {/* Bochecha Pêssego Coral */}
          <ellipse cx="13.2" cy="7" rx="3.6" ry="2.2" fill="#FF9B85" />

          {/* Sorriso de voo */}
          <path
            d="M 19.5 5 Q 22.8 7 24.2 4.2"
            stroke="#2D3142"
            strokeWidth="1.9"
            strokeLinecap="round"
          />

          {/* Antena com ponta Pêssego Coral */}
          <path
            d="M 16.5 -10 Q 23 -22 30.5 -18.5"
            stroke="#2D3142"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="31.5" cy="-18.5" r="3.5" fill="#FF9B85" />
        </g>
      </svg>

      {label && (
        <p className="mt-1 font-display text-lg font-medium text-[#2D3142]">
          {label}
        </p>
      )}
      {sublabel && (
        <p className="mt-1 font-sans text-xs text-[#646B82] max-w-[36ch]">
          {sublabel}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full bg-[#FFFDF8] flex items-center justify-center p-6">
        {content}
      </div>
    );
  }

  return content;
}
