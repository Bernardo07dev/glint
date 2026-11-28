"use client";

import { useEffect, useRef } from "react";
import { AnimationStageShell } from "../animation-stage-shell";
import { FrontBeeBody, FrontBeeEyes } from "../bee-parts";
import { DYNAMIC_SCENE_PRESETS } from "../types";

interface FirstAccessAnimationProps {
  headline?: string;
  userName?: string;
  isExiting?: boolean;
  className?: string;
}

const CONFETTI_PIECES = [
  { x: 470, y: 310, type: "star", size: 17, color: "#FFE07D" },
  { x: 965, y: 295, type: "star", size: 19, color: "#FF9B85" },
  { x: 425, y: 465, type: "dot", size: 9, color: "#95E1B0" },
  { x: 1015, y: 455, type: "dot", size: 10, color: "#5B8DEF" },
  { x: 525, y: 610, type: "star", size: 14, color: "#5B8DEF" },
  { x: 915, y: 600, type: "star", size: 15, color: "#95E1B0" },
  { x: 350, y: 375, type: "pill", rot: -28, color: "#FF9B85" },
  { x: 1090, y: 365, type: "pill", rot: 32, color: "#FFE07D" },
  { x: 390, y: 550, type: "pill", rot: 22, color: "#5B8DEF" },
  { x: 1045, y: 545, type: "pill", rot: -24, color: "#95E1B0" },
] as const;

/**
 * Cena 1 — FIRST_ACCESS:
 * Mesmo modelo frontal característico da Abelhinha (sem óculos, olhinhos redondos originais),
 * com coreografia dinâmica de PULO + VOO LIVRE em loop ∞ pelo palco com rastro luminoso antes de pousar!
 */
export function FirstAccessAnimation({
  headline,
  userName = "Bernardo",
  isExiting = false,
  className = "",
}: FirstAccessAnimationProps) {
  const preset = DYNAMIC_SCENE_PRESETS.FIRST_ACCESS;
  const resolvedHeadline =
    headline ?? `Bem vindooo, ${userName}! Que bom te ter aqui.`;

  const actorRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const launchRingRef = useRef<SVGEllipseElement>(null);
  const flightTrailRef = useRef<SVGPathElement>(null);
  const flightDotsRef = useRef<SVGPathElement>(null);
  const leftArmRef = useRef<SVGGElement>(null);
  const rightArmRef = useRef<SVGGElement>(null);
  const leftLegRef = useRef<SVGGElement>(null);
  const rightLegRef = useRef<SVGGElement>(null);
  const leftWingRef = useRef<SVGGElement>(null);
  const rightWingRef = useRef<SVGGElement>(null);
  const leftAntennaRef = useRef<SVGGElement>(null);
  const rightAntennaRef = useRef<SVGGElement>(null);
  const confettiGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    let rafId = 0;
    let startTime: number | null = null;

    const cyclePeriod = 4.6;
    const trailHistory: Array<{ x: number; y: number }> = [];
    let lastCycleIndex = -1;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const t = (now - startTime) / 1000;

      const cycleIndex = Math.floor(t / cyclePeriod);
      if (cycleIndex !== lastCycleIndex) {
        trailHistory.length = 0;
        lastCycleIndex = cycleIndex;
      }

      const ct = t % cyclePeriod;

      let posX = 0;
      let posY = 0;
      let scaleX = 1;
      let scaleY = 1;
      let bankAngle = 0;
      let wingFreq = 24;
      let wingAmp = 10;
      let isAirborne = false;
      let legTuck = 0;
      let launchRingProgress = -1;

      if (ct < 0.28) {
        const u = ct / 0.28;
        const crouch = Math.sin(u * Math.PI * 0.5);
        posY = 12 * crouch;
        scaleX = 1 + 0.12 * crouch;
        scaleY = 1 - 0.12 * crouch;
        wingFreq = 18;
        wingAmp = 8;
      } else if (ct < 0.85) {
        const u = (ct - 0.28) / 0.57;
        const easeOut = 1 - Math.pow(1 - u, 2.4);
        posY = 12 * (1 - easeOut) - 110 * easeOut;
        const stretchAmount = Math.sin(u * Math.PI);
        scaleX = 1 - 0.08 * stretchAmount;
        scaleY = 1 + 0.1 * stretchAmount;
        bankAngle = Math.sin(u * Math.PI) * -4;
        wingFreq = 36;
        wingAmp = 15;
        isAirborne = true;
        legTuck = easeOut;
        launchRingProgress = u;
      } else if (ct < 3.75) {
        const u = (ct - 0.85) / 2.9;
        const smoothU = u * u * (3 - 2 * u);

        posX = Math.sin(smoothU * Math.PI * 2) * 195;
        posY =
          -110 -
          Math.sin(smoothU * Math.PI) * 55 +
          Math.sin(smoothU * Math.PI * 4) * 32;

        const dxDt = Math.cos(smoothU * Math.PI * 2);
        const flightEnvelope = Math.sin(smoothU * Math.PI);
        bankAngle = dxDt * 22 * Math.min(1, flightEnvelope * 2.2);

        scaleX = 1;
        scaleY = 1;
        wingFreq = 38;
        wingAmp = 16;
        isAirborne = true;
        legTuck = 1;
      } else {
        const u = (ct - 3.75) / 0.85;
        if (u < 0.55) {
          const d = u / 0.55;
          const easeIn = d * d;
          posY = -110 * (1 - easeIn);
          bankAngle = (1 - d) * 6;
          wingFreq = 28;
          wingAmp = 12;
          isAirborne = d < 0.92;
          legTuck = 1 - easeIn;
        } else {
          const l = (u - 0.55) / 0.45;
          const bounce = Math.sin(l * Math.PI) * (1 - l * 0.4);
          posY = 8 * bounce;
          scaleX = 1 + 0.09 * bounce;
          scaleY = 1 - 0.08 * bounce;
          wingFreq = 20;
          wingAmp = 8;
        }
      }

      if (actorRef.current) {
        actorRef.current.setAttribute(
          "transform",
          `translate(${posX.toFixed(2)}, ${posY.toFixed(2)}) rotate(${bankAngle.toFixed(2)}) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`,
        );
      }

      if (shadowRef.current) {
        const altitude = Math.max(0, -posY);
        const altRatio = Math.min(altitude / 170, 1);
        const shRx = Math.max(32, 78 - altRatio * 42);
        const shOp = Math.max(0.18, 0.72 - altRatio * 0.52);
        shadowRef.current.setAttribute("cx", posX.toFixed(1));
        shadowRef.current.setAttribute("rx", shRx.toFixed(1));
        shadowRef.current.setAttribute("opacity", shOp.toFixed(2));
      }

      if (launchRingRef.current) {
        if (launchRingProgress >= 0 && launchRingProgress < 1) {
          const rx = 28 + launchRingProgress * 92;
          const ry = 8 + launchRingProgress * 22;
          const op = (1 - launchRingProgress) * 0.72;
          launchRingRef.current.setAttribute("rx", rx.toFixed(1));
          launchRingRef.current.setAttribute("ry", ry.toFixed(1));
          launchRingRef.current.setAttribute("opacity", op.toFixed(2));
        } else {
          launchRingRef.current.setAttribute("opacity", "0");
        }
      }

      if (isAirborne) {
        trailHistory.push({
          x: 720 + posX * 1.72,
          y: 495 + posY * 1.72,
        });
        if (trailHistory.length > 34) {
          trailHistory.shift();
        }
      } else if (trailHistory.length > 0) {
        trailHistory.shift();
        if (trailHistory.length > 0) trailHistory.shift();
      }

      const trailPathD =
        trailHistory.length >= 2
          ? trailHistory
              .map(
                (pt, idx) =>
                  `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
              )
              .join(" ")
          : "";

      if (flightTrailRef.current) {
        flightTrailRef.current.setAttribute("d", trailPathD);
        flightTrailRef.current.setAttribute(
          "opacity",
          trailHistory.length >= 2 ? "0.85" : "0",
        );
      }
      if (flightDotsRef.current) {
        flightDotsRef.current.setAttribute("d", trailPathD);
        flightDotsRef.current.setAttribute(
          "opacity",
          trailHistory.length >= 2 ? "0.95" : "0",
        );
        flightDotsRef.current.style.strokeDashoffset = `${-((t * 140) % 26)}`;
      }

      const armWaveL =
        ct < 0.28
          ? 28
          : isAirborne
            ? Math.sin(t * 10) * 10 - 14
            : Math.sin(t * 13) * 16 - 8;
      const armWaveR =
        ct < 0.28
          ? -28
          : isAirborne
            ? Math.cos(t * 10) * 10 + 14
            : Math.cos(t * 13) * 16 + 8;
      if (leftArmRef.current) {
        leftArmRef.current.setAttribute(
          "transform",
          `rotate(${armWaveL.toFixed(2)} -48 -2)`,
        );
      }
      if (rightArmRef.current) {
        rightArmRef.current.setAttribute(
          "transform",
          `rotate(${armWaveR.toFixed(2)} 48 -2)`,
        );
      }

      const legSwing = isAirborne ? Math.sin(t * 9) * 8 : 0;
      if (leftLegRef.current) {
        leftLegRef.current.setAttribute(
          "transform",
          `translate(0, ${(-legTuck * 8).toFixed(1)}) rotate(${(legTuck * 14 + legSwing).toFixed(1)} -20 62)`,
        );
      }
      if (rightLegRef.current) {
        rightLegRef.current.setAttribute(
          "transform",
          `translate(0, ${(-legTuck * 8).toFixed(1)}) rotate(${(-legTuck * 14 - legSwing).toFixed(1)} 20 62)`,
        );
      }

      const wingFlap = Math.sin(t * wingFreq) * wingAmp;
      if (leftWingRef.current) {
        leftWingRef.current.setAttribute(
          "transform",
          `rotate(${(-wingFlap).toFixed(2)} -50 -10)`,
        );
      }
      if (rightWingRef.current) {
        rightWingRef.current.setAttribute(
          "transform",
          `rotate(${wingFlap.toFixed(2)} 50 -10)`,
        );
      }

      const antL = Math.sin(t * 8.5 - 0.5) * 9 - bankAngle * 0.35;
      const antR = Math.cos(t * 8.5 - 0.3) * 9 - bankAngle * 0.35;
      if (leftAntennaRef.current) {
        leftAntennaRef.current.setAttribute(
          "transform",
          `translate(-18, -74) rotate(${antL.toFixed(2)})`,
        );
      }
      if (rightAntennaRef.current) {
        rightAntennaRef.current.setAttribute(
          "transform",
          `translate(18, -74) rotate(${antR.toFixed(2)})`,
        );
      }

      if (confettiGroupRef.current) {
        const floatC = Math.sin(t * 2.4) * 8;
        confettiGroupRef.current.setAttribute(
          "transform",
          `translate(0, ${floatC.toFixed(1)})`,
        );
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <AnimationStageShell
      headline={resolvedHeadline}
      ariaLabel={`Animação Full-Screen: ${preset.sectionLabel}`}
      bgBase={preset.bgBase}
      haloPrimary={preset.haloPrimary}
      haloSecondary={preset.haloSecondary}
      isExiting={isExiting}
      className={className}
    >
      {/* Halo Solar Inaugural atrás da Abelhinha */}
      <g transform="translate(720, 495)">
        <circle r="290" fill="#FFF0E5" opacity="0.62" />
        <circle
          r="235"
          stroke="#FFE07D"
          strokeWidth="4"
          strokeDasharray="12 18"
          opacity="0.8"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="24s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r="178" fill="#FFE07D" opacity="0.28" />
      </g>

      {/* Trilha Aérea Dinâmica desenhada durante o voo em ∞ */}
      <path
        ref={flightTrailRef}
        d=""
        stroke="#5B8DEF"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0"
      />
      <path
        ref={flightDotsRef}
        d=""
        stroke="#FF9B85"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 24"
        fill="none"
        opacity="0"
        transform="translate(0, 12)"
      />

      {/* Confetes, estrelas de 4 pontas e fitinhas Aquarela Viva */}
      <g ref={confettiGroupRef}>
        {CONFETTI_PIECES.map((c, idx) => {
          if (c.type === "star") {
            return (
              <g
                key={idx}
                transform={`translate(${c.x}, ${c.y})`}
                className="animate-star-pulse"
                style={{ animationDelay: `${idx * 180}ms` }}
              >
                <path
                  d={`M 0 -${c.size} L ${c.size * 0.28} -${c.size * 0.28} L ${c.size} 0 L ${c.size * 0.28} ${c.size * 0.28} L 0 ${c.size} L -${c.size * 0.28} ${c.size * 0.28} L -${c.size} 0 L -${c.size * 0.28} -${c.size * 0.28} Z`}
                  fill={c.color}
                />
              </g>
            );
          }
          if (c.type === "dot") {
            return (
              <circle
                key={idx}
                cx={c.x}
                cy={c.y}
                r={c.size}
                fill={c.color}
                opacity="0.9"
              />
            );
          }
          return (
            <rect
              key={idx}
              x={c.x - 12}
              y={c.y - 4.5}
              width="24"
              height="9"
              rx="4.5"
              fill={c.color}
              transform={`rotate(${c.rot} ${c.x} ${c.y})`}
              opacity="0.9"
            />
          );
        })}
      </g>

      {/* Abelhinha Frontal Pulando e Voando */}
      <g transform="translate(720, 495) scale(1.72)">
        <ellipse
          ref={launchRingRef}
          cx="0"
          cy="108"
          rx="28"
          ry="8"
          stroke="#FFE07D"
          strokeWidth="3.5"
          fill="none"
          opacity="0"
        />

        <ellipse
          ref={shadowRef}
          cx="0"
          cy="108"
          rx="78"
          ry="14"
          fill="#E8E1D3"
          opacity="0.72"
        />

        <g ref={actorRef}>
          <g ref={leftLegRef}>
            <path
              d="M -20 62 Q -27 80 -31 94"
              stroke="#2D3142"
              strokeWidth="7.5"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse
              cx="-35"
              cy="97"
              rx="14.5"
              ry="7.5"
              transform="rotate(-14 -35 97)"
              fill="#2D3142"
            />
          </g>
          <g ref={rightLegRef}>
            <path
              d="M 20 62 Q 27 80 31 94"
              stroke="#2D3142"
              strokeWidth="7.5"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse
              cx="35"
              cy="97"
              rx="14.5"
              ry="7.5"
              transform="rotate(14 35 97)"
              fill="#2D3142"
            />
          </g>

          <g ref={leftWingRef}>
            <ellipse
              cx="-66"
              cy="-14"
              rx="34"
              ry="19"
              transform="rotate(-22 -66 -14)"
              fill="#95E1B0"
              stroke="#7AD39B"
              strokeWidth="2"
            />
            <ellipse
              cx="-58"
              cy="12"
              rx="25"
              ry="14"
              transform="rotate(10 -58 12)"
              fill="#95E1B0"
              opacity="0.82"
            />
          </g>
          <g ref={rightWingRef}>
            <ellipse
              cx="66"
              cy="-14"
              rx="34"
              ry="19"
              transform="rotate(22 66 -14)"
              fill="#95E1B0"
              stroke="#7AD39B"
              strokeWidth="2"
            />
            <ellipse
              cx="58"
              cy="12"
              rx="25"
              ry="14"
              transform="rotate(-10 58 12)"
              fill="#95E1B0"
              opacity="0.82"
            />
          </g>

          <FrontBeeBody />

          {/* Bracinhos erguidos comemorando */}
          <g ref={leftArmRef}>
            <path
              d="M -52 2 C -74 -6, -84 -28, -74 -48"
              stroke="#2D3142"
              strokeWidth="7.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="-74" cy="-50" r="6.5" fill="#2D3142" />
          </g>
          <g ref={rightArmRef}>
            <path
              d="M 52 2 C 74 -6, 84 -28, 74 -48"
              stroke="#2D3142"
              strokeWidth="7.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="74" cy="-50" r="6.5" fill="#2D3142" />
          </g>

          <g ref={leftAntennaRef} transform="translate(-18, -74)">
            <path
              d="M 0 4 Q -10 -22 -24 -26"
              stroke="#2D3142"
              strokeWidth="4.2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="-25" cy="-26" r="6.5" fill="#FF9B85" />
            <circle cx="-27" cy="-28" r="2.2" fill="#FFFDF8" opacity="0.85" />
          </g>
          <g ref={rightAntennaRef} transform="translate(18, -74)">
            <path
              d="M 0 4 Q 10 -22 24 -26"
              stroke="#2D3142"
              strokeWidth="4.2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="25" cy="-26" r="6.5" fill="#FF9B85" />
            <circle cx="23" cy="-28" r="2.2" fill="#FFFDF8" opacity="0.85" />
          </g>

          <path
            d="M -30 -39 Q -21 -46 -12 -39"
            stroke="#2D3142"
            strokeWidth="3.3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 12 -39 Q 21 -46 30 -39"
            stroke="#2D3142"
            strokeWidth="3.3"
            strokeLinecap="round"
            fill="none"
          />

          <g className="animate-bee-blink">
            <FrontBeeEyes />
          </g>

          <ellipse cx="-33" cy="-4.5" rx="8" ry="4.8" fill="#FF9B85" opacity="0.92" />
          <ellipse cx="33" cy="-4.5" rx="8" ry="4.8" fill="#FF9B85" opacity="0.92" />

          <path
            d="M -7.5 -4.5 Q 0 3 7.5 -4.5"
            stroke="#2D3142"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </g>
    </AnimationStageShell>
  );
}
