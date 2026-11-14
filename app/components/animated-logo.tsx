"use client";

import { useEffect, useId, useRef, useState } from "react";

interface AnimatedLogoProps {
  className?: string;
}

/**
 * Logo oficial do Glint com a animação de assinatura:
 * a abelhinha de perfil parte da estrela #FFE07D, desenha a cauda pontilhada (#FF9B85)
 * e fecha o anel superior (#5B8DEF) em um voo contínuo, orgânico e leve antes de pousar no topo do "g".
 */
export function AnimatedLogo({ className = "h-12 w-auto" }: AnimatedLogoProps) {
  const uid = useId().replace(/:/g, "");
  const lowerMaskId = `lower-trail-mask-${uid}`;

  const lowerPathRef = useRef<SVGPathElement>(null);
  const lowerMaskPathRef = useRef<SVGPathElement>(null);
  const upperPathRef = useRef<SVGPathElement>(null);
  const beeGroupRef = useRef<SVGGElement>(null);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lowerPath = lowerPathRef.current;
    const lowerMaskPath = lowerMaskPathRef.current;
    const upperPath = upperPathRef.current;
    const beeGroup = beeGroupRef.current;

    if (!lowerPath || !lowerMaskPath || !upperPath || !beeGroup) return;

    const lowerLen = lowerPath.getTotalLength();
    const upperLen = upperPath.getTotalLength();
    const totalLen = lowerLen + upperLen;

    if (prefersReducedMotion) {
      lowerMaskPath.style.strokeDasharray = `${lowerLen}`;
      lowerMaskPath.style.strokeDashoffset = "0";
      upperPath.style.strokeDasharray = `${upperLen}`;
      upperPath.style.strokeDashoffset = "0";
      beeGroup.setAttribute("transform", "translate(80, 31) rotate(-16)");
      setLanded(true);
      return;
    }

    // Estado inicial antes do voo: rastro pontilhado e anel superior ocultos
    lowerMaskPath.style.strokeDasharray = `${lowerLen}`;
    lowerMaskPath.style.strokeDashoffset = `${lowerLen}`;
    upperPath.style.strokeDasharray = `${upperLen}`;
    upperPath.style.strokeDashoffset = `${upperLen}`;

    const duration = 1850;
    let startTime: number | null = null;
    let lastTime: number | null = null;
    let rafId = 0;

    // Estado amortecido (low-pass filter) para evitar chicotes bruscos na curvatura
    let smoothX = 40;
    let smoothY = 83;
    let smoothAngle = 42;
    let initialized = false;

    // Curva orgânica com partida gentil e pouso desacelerado (quintic out + sine blend)
    const easeFluidFlight = (t: number) => {
      if (t < 0.35) {
        return 0.5 * (1 - Math.cos(Math.PI * t));
      }
      const u = (t - 0.35) / 0.65;
      const base = 0.5 * (1 - Math.cos(Math.PI * 0.35));
      const quintOut = 1 - Math.pow(1 - u, 3.2);
      return base + (1 - base) * quintOut;
    };

    const normalizeAngleDelta = (target: number, current: number) => {
      let delta = ((target - current + 540) % 360) - 180;
      if (delta < -180) delta += 360;
      return delta;
    };

    const samplePointAndAngle = (distAlongFlight: number) => {
      const clamped = Math.max(0, Math.min(totalLen, distAlongFlight));
      const lookWindow = 5.5;

      const getCoords = (d: number) => {
        if (d <= lowerLen) {
          // lowerPath é definido do meio (80,46) até a base (40,83); percorremos do fim para o começo
          return lowerPath.getPointAtLength(Math.max(0, lowerLen - d));
        }
        return upperPath.getPointAtLength(
          Math.min(upperLen, d - lowerLen)
        );
      };

      const pt = getCoords(clamped);
      const backPt = getCoords(Math.max(0, clamped - lookWindow));
      const frontPt = getCoords(Math.min(totalLen, clamped + lookWindow));
      const rawAngle =
        (Math.atan2(frontPt.y - backPt.y, frontPt.x - backPt.x) * 180) /
        Math.PI;

      // Limita inclinações extremas de ponta-cabeça para manter a postura leve da abelhinha
      const softAngle = Math.max(-72, Math.min(68, rawAngle * 0.62));

      return { x: pt.x, y: pt.y, angle: softAngle };
    };

    const tick = (now: number) => {
      if (startTime === null) {
        startTime = now;
        lastTime = now;
      }
      const dt = Math.min((now - (lastTime ?? now)) / 1000, 0.05);
      lastTime = now;

      const rawProgress = Math.min((now - startTime) / duration, 1);
      const flightProgress = easeFluidFlight(rawProgress);
      const currentDist = flightProgress * totalLen;

      // Revela progressivamente a cauda pontilhada e depois o anel contínuo em velocidade uniforme de arco
      if (currentDist <= lowerLen) {
        lowerMaskPath.style.strokeDashoffset = `${lowerLen - currentDist}`;
        upperPath.style.strokeDashoffset = `${upperLen}`;
      } else {
        lowerMaskPath.style.strokeDashoffset = "0";
        const upperDist = currentDist - lowerLen;
        upperPath.style.strokeDashoffset = `${Math.max(0, upperLen - upperDist)}`;
      }

      const sampled = samplePointAndAngle(currentDist);

      // Nos últimos 26% do trajeto, faz transição contínua (smoothstep) para o pouso em (80, 31) a -16°
      const landingWindow = Math.max(0, (flightProgress - 0.74) / 0.26);
      const landingBlend =
        landingWindow * landingWindow * (3 - 2 * landingWindow);

      // Oscilação leve de voo que diminui suavemente conforme ela pousa
      const hoverWave =
        Math.sin(rawProgress * Math.PI * 3.5) * 1.6 * (1 - landingBlend);

      const targetX = sampled.x * (1 - landingBlend) + 80 * landingBlend;
      const targetY =
        (sampled.y + hoverWave) * (1 - landingBlend) + 31 * landingBlend;
      const targetAngle =
        sampled.angle * (1 - landingBlend) + -16 * landingBlend;

      if (!initialized) {
        smoothX = targetX;
        smoothY = targetY;
        smoothAngle = targetAngle;
        initialized = true;
      } else {
        const posFactor = 1 - Math.exp(-22 * dt);
        const rotFactor = 1 - Math.exp(-14 * dt);
        smoothX += (targetX - smoothX) * posFactor;
        smoothY += (targetY - smoothY) * posFactor;
        smoothAngle +=
          normalizeAngleDelta(targetAngle, smoothAngle) * rotFactor;
      }

      beeGroup.setAttribute(
        "transform",
        `translate(${smoothX.toFixed(2)}, ${smoothY.toFixed(2)}) rotate(${smoothAngle.toFixed(2)})`
      );

      if (rawProgress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        lowerMaskPath.style.strokeDashoffset = "0";
        upperPath.style.strokeDashoffset = "0";
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
      <defs>
        {/* Máscara que revela o pontilhado da cauda no sentido exato do voo (da estrela até o anel) */}
        <mask id={lowerMaskId}>
          <path
            ref={lowerMaskPathRef}
            d="M 40 83 C 33 91, 39 101, 55 101 C 81 101, 80 74, 80 46"
            stroke="#FFFFFF"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
        </mask>
      </defs>

      {/* Estrela inicial de 4 pontas em Manteiga Solar */}
      <path
        d="M 38 80 L 40.8 86.5 L 47.3 89.3 L 40.8 92.1 L 38 98.6 L 35.2 92.1 L 28.7 89.3 L 35.2 86.5 Z"
        fill="#FFE07D"
        className={landed ? "" : "animate-star-pulse"}
      />

      {/* Cauda pontilhada do 'g' em Pêssego Coral revelada progressivamente */}
      <path
        ref={lowerPathRef}
        d="M 80 46 C 80 74, 81 101, 55 101 C 39 101, 33 91, 40 83"
        stroke="#FF9B85"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeDasharray="1 10"
        mask={`url(#${lowerMaskId})`}
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


