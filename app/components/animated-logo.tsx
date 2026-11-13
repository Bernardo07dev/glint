"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedLogoProps {
  className?: string;
}

/**
 * Logo oficial do Glint com a animação de assinatura:
 * a abelhinha de perfil parte da estrela #FFE07D, desenha a cauda pontilhada (#FF9B85)
 * e fecha o anel superior (#5B8DEF) em 1550ms antes de pousar no topo do "g".
 */
export function AnimatedLogo({ className = "h-12 w-auto" }: AnimatedLogoProps) {
  const lowerPathRef = useRef<SVGPathElement>(null);
  const upperPathRef = useRef<SVGPathElement>(null);
  const beeGroupRef = useRef<SVGGElement>(null);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lowerPath = lowerPathRef.current;
    const upperPath = upperPathRef.current;
    const beeGroup = beeGroupRef.current;

    if (!lowerPath || !upperPath || !beeGroup) return;

    const lowerLen = lowerPath.getTotalLength();
    const upperLen = upperPath.getTotalLength();

    if (prefersReducedMotion) {
      lowerPath.style.strokeDashoffset = "0";
      upperPath.style.strokeDashoffset = "0";
      beeGroup.setAttribute("transform", "translate(80, 31) rotate(-16)");
      setLanded(true);
      return;
    }

    // Estado inicial antes do voo
    upperPath.style.strokeDasharray = `${upperLen}`;
    upperPath.style.strokeDashoffset = `${upperLen}`;
    lowerPath.style.opacity = "0";

    const duration = 1550;
    let startTime: number | null = null;
    let rafId = 0;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const rawProgress = Math.min((now - startTime) / duration, 1);
      const progress = easeInOutCubic(rawProgress);

      if (progress < 0.08) {
        // 0% - 8%: Ignição na estrela inicial
        beeGroup.setAttribute("transform", "translate(38, 86) rotate(-25)");
      } else if (progress < 0.42) {
        // 8% - 42%: Cauda pontilhada em Pêssego Coral
        const localT = (progress - 0.08) / 0.34;
        lowerPath.style.opacity = `${Math.min(localT * 1.4, 1)}`;
        // Percorre do final (base esquerda) até o encontro com o anel superior
        const dist = lowerLen * (1 - localT);
        const pt = lowerPath.getPointAtLength(dist);
        const nextPt = lowerPath.getPointAtLength(Math.max(dist - 2, 0));
        const angle =
          (Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * 180) / Math.PI;
        beeGroup.setAttribute(
          "transform",
          `translate(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}) rotate(${angle.toFixed(1)})`
        );
      } else {
        // 42% - 100%: Anel superior contínuo em Cobalto Pastel
        lowerPath.style.opacity = "1";
        const localT = (progress - 0.42) / 0.58;
        upperPath.style.strokeDashoffset = `${upperLen * (1 - localT)}`;
        const dist = upperLen * localT;
        const pt = upperPath.getPointAtLength(dist);
        const nextPt = upperPath.getPointAtLength(Math.min(dist + 2, upperLen));
        const tangentAngle =
          (Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * 180) / Math.PI;

        // Blend suave para -16deg nos últimos 12%
        const blend = localT > 0.88 ? (localT - 0.88) / 0.12 : 0;
        const finalAngle = tangentAngle * (1 - blend) + -16 * blend;
        const finalX = pt.x * (1 - blend) + 80 * blend;
        const finalY = pt.y * (1 - blend) + 31 * blend;

        beeGroup.setAttribute(
          "transform",
          `translate(${finalX.toFixed(2)}, ${finalY.toFixed(2)}) rotate(${finalAngle.toFixed(1)})`
        );
      }

      if (rawProgress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        beeGroup.setAttribute("transform", "translate(80, 31) rotate(-16)");
        setLanded(true);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 265 115"
      fill="none"
      className={className}
      aria-label="Glint"
      role="img"
    >
      {/* Estrela inicial de 4 pontas em Manteiga Solar */}
      <path
        d="M 38 80 L 40.8 86.5 L 47.3 89.3 L 40.8 92.1 L 38 98.6 L 35.2 92.1 L 28.7 89.3 L 35.2 86.5 Z"
        fill="#FFE07D"
        className={landed ? "" : "animate-star-pulse"}
      />

      {/* Cauda pontilhada do 'g' em Pêssego Coral */}
      <path
        ref={lowerPathRef}
        d="M 80 46 C 80 74, 81 101, 55 101 C 39 101, 33 91, 40 83"
        stroke="#FF9B85"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeDasharray="1 10"
      />

      {/* Anel superior do 'g' em Cobalto Pastel */}
      <path
        ref={upperPathRef}
        d="M 80 46 C 80 65, 40 67, 40 46 C 40 26, 76 25, 80 43"
        stroke="#5B8DEF"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Abelhinha de Perfil */}
      <g ref={beeGroupRef} transform="translate(80, 31) rotate(-16)">
        <g className={landed ? "animate-gentle-float" : ""}>
          <ellipse
            cx="-6"
            cy="-11"
            rx="11"
            ry="6.5"
            transform="rotate(-12 -6 -11)"
            fill="#95E1B0"
            className="animate-wing-beat"
          />
          <ellipse
            cx="4"
            cy="-10"
            rx="8.5"
            ry="5"
            transform="rotate(14 4 -10)"
            fill="#95E1B0"
            opacity="0.82"
            className="animate-wing-beat"
          />
          <rect x="-15" y="-8" width="30" height="21" rx="10.5" fill="#FFE07D" />
          <path
            d="M -5 -7.5 L -5 12.5 M 2.5 -7.5 L 2.5 12.5"
            stroke="#5B8DEF"
            strokeWidth="3.8"
          />
          <circle cx="9.5" cy="0.5" r="2.4" fill="#2D3142" />
          <circle cx="10.3" cy="-0.3" r="0.9" fill="#FFFDF8" />
          <ellipse cx="8.5" cy="4.5" rx="2.3" ry="1.4" fill="#FF9B85" />
          <path
            d="M 11 -6 Q 15 -13 19 -11"
            stroke="#2D3142"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="19.5" cy="-11" r="2.2" fill="#FF9B85" />
        </g>
      </g>

      {/* Wordmark Geométrico Bicolor "lint" */}
      <rect x="108" y="20" width="9" height="56" rx="4.5" fill="#2D3142" />
      <rect x="131" y="41" width="9" height="35" rx="4.5" fill="#5B8DEF" />
      <path
        d="M 135.5 18 L 138.3 25 L 145.3 27.8 L 138.3 30.6 L 135.5 37.6 L 132.7 30.6 L 125.7 27.8 L 132.7 25 Z"
        fill="#FF9B85"
      />
      <path
        d="M 156 45 L 156 72 M 156 54 C 156 41, 185 41, 185 55 L 185 72"
        stroke="#2D3142"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M 211 26 L 211 66 C 211 72, 216 74, 223 73"
        stroke="#2D3142"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect x="199" y="39" width="25" height="7.5" rx="3.75" fill="#FF9B85" />
    </svg>
  );
}

