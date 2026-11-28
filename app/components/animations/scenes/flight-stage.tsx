"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { BeeScenePose } from "../types";
import { BeeVectorActor, SparkleField } from "../bee-parts";

interface FlightBeeStageProps {
  flightPathD: string;
  pose: BeeScenePose;
  flightDurationMs?: number;
  haloPrimary: string;
  ribbonPrimary: string;
  ribbonSecondary: string;
  accentColor: string;
  loopFlight?: boolean;
  onComplete?: () => void;
  backgroundLayer?: ReactNode;
}

/**
 * Motor vetorial 60fps para cenas de voo lateral (HOME_SPLASH, PLAN_CREATION, PLANS_HUB):
 * trajetória contínua parametrizada por arco, tripla fita aquarela, partículas na esteira e anel de energia.
 */
export function FlightBeeStage({
  flightPathD,
  pose,
  flightDurationMs = 3200,
  haloPrimary,
  ribbonPrimary,
  ribbonSecondary,
  accentColor,
  loopFlight = true,
  onComplete,
  backgroundLayer,
}: FlightBeeStageProps) {
  const uid = useId().replace(/:/g, "");
  const trailMaskId = `full-trail-mask-${uid}`;
  const trailGradId = `full-trail-grad-${uid}`;

  const primaryPathRef = useRef<SVGPathElement>(null);
  const secondaryRibbonRef = useRef<SVGPathElement>(null);
  const dottedPathRef = useRef<SVGPathElement>(null);
  const maskPathRef = useRef<SVGPathElement>(null);
  const beeGroupRef = useRef<SVGGElement>(null);
  const wakeSpark1Ref = useRef<SVGGElement>(null);
  const wakeSpark2Ref = useRef<SVGGElement>(null);
  const wakeSpark3Ref = useRef<SVGGElement>(null);
  const wakeSpark4Ref = useRef<SVGGElement>(null);
  const pulseRingRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const primaryPath = primaryPathRef.current;
    const secondaryRibbon = secondaryRibbonRef.current;
    const dottedPath = dottedPathRef.current;
    const maskPath = maskPathRef.current;
    const beeGroup = beeGroupRef.current;

    if (!primaryPath || !dottedPath || !maskPath || !beeGroup) return;

    const totalLen = primaryPath.getTotalLength();

    if (prefersReducedMotion) {
      primaryPath.style.strokeDasharray = `${totalLen}`;
      primaryPath.style.strokeDashoffset = "0";
      if (secondaryRibbon) {
        secondaryRibbon.style.strokeDasharray = `${totalLen}`;
        secondaryRibbon.style.strokeDashoffset = "0";
      }
      maskPath.style.strokeDasharray = `${totalLen}`;
      maskPath.style.strokeDashoffset = "0";
      const endPt = primaryPath.getPointAtLength(totalLen * 0.58);
      beeGroup.setAttribute(
        "transform",
        `translate(${endPt.x.toFixed(1)}, ${endPt.y.toFixed(1)}) rotate(-10) scale(1.92)`,
      );
      return;
    }

    primaryPath.style.strokeDasharray = `${totalLen}`;
    primaryPath.style.strokeDashoffset = `${totalLen}`;
    if (secondaryRibbon) {
      secondaryRibbon.style.strokeDasharray = `${totalLen}`;
      secondaryRibbon.style.strokeDashoffset = `${totalLen}`;
    }
    maskPath.style.strokeDasharray = `${totalLen}`;
    maskPath.style.strokeDashoffset = `${totalLen}`;

    let rafId = 0;
    let startTime: number | null = null;
    let lastTime: number | null = null;

    let smoothX = 0;
    let smoothY = 0;
    let smoothAngle = -10;
    let initialized = false;

    const hoverDurationMs = loopFlight ? 2600 : 1000;
    const cycleTotalMs = flightDurationMs + hoverDurationMs;

    const easeFlight = (t: number) => {
      return t < 0.45 ? 2.1 * t * t : 1 - Math.pow(-2 * t + 2, 2.5) / 2;
    };

    const samplePointAndAngle = (dist: number) => {
      const clamped = Math.max(0, Math.min(totalLen, dist));
      const lookWindow = 22;
      const pt = primaryPath.getPointAtLength(clamped);
      const backPt = primaryPath.getPointAtLength(Math.max(0, clamped - lookWindow));
      const frontPt = primaryPath.getPointAtLength(
        Math.min(totalLen, clamped + lookWindow),
      );

      const rawAngle =
        (Math.atan2(frontPt.y - backPt.y, frontPt.x - backPt.x) * 180) / Math.PI;

      const softAngle = Math.max(-44, Math.min(36, rawAngle * 0.56));
      return { x: pt.x, y: pt.y, angle: softAngle };
    };

    const tick = (now: number) => {
      if (startTime === null) {
        startTime = now;
        lastTime = now;
      }
      const dt = Math.min((now - (lastTime ?? now)) / 1000, 0.05);
      lastTime = now;

      const elapsed = now - startTime;

      if (!loopFlight && elapsed >= cycleTotalMs) {
        onComplete?.();
        return;
      }

      const cycleElapsed = loopFlight ? elapsed % cycleTotalMs : elapsed;
      const rawProgress = Math.min(cycleElapsed / flightDurationMs, 1);
      const flightProgress = easeFlight(rawProgress);

      const targetProgress = 0.78 * flightProgress;
      const currentDist = targetProgress * totalLen;

      const dashOffset = `${Math.max(0, totalLen - currentDist)}`;
      primaryPath.style.strokeDashoffset = dashOffset;
      if (secondaryRibbon) {
        secondaryRibbon.style.strokeDashoffset = dashOffset;
      }
      maskPath.style.strokeDashoffset = dashOffset;
      dottedPath.style.strokeDashoffset = `${-((elapsed / 1000) * 115) % 26}`;

      const sampled = samplePointAndAngle(currentDist);

      const hoverPhase = (elapsed / 1000) * 2.9;
      const isHovering = rawProgress >= 1;
      const floatY = Math.sin(hoverPhase) * (isHovering ? 16 : 9);
      const floatX = isHovering ? Math.sin(hoverPhase * 0.6) * 14 : 0;
      const hoverAngleOffset = isHovering
        ? Math.cos(hoverPhase) * 7 - sampled.angle - 8
        : Math.cos(hoverPhase) * 4;

      const targetX = sampled.x + floatX;
      const targetY = sampled.y + floatY;
      const targetAngle = sampled.angle + hoverAngleOffset;

      if (!initialized || cycleElapsed < 35) {
        smoothX = targetX;
        smoothY = targetY;
        smoothAngle = targetAngle;
        initialized = true;
      } else {
        const posFactor = 1 - Math.exp(-16 * dt);
        const rotFactor = 1 - Math.exp(-11 * dt);
        smoothX += (targetX - smoothX) * posFactor;
        smoothY += (targetY - smoothY) * posFactor;
        smoothAngle += (targetAngle - smoothAngle) * rotFactor;
      }

      const beeScale =
        typeof window !== "undefined" && window.innerWidth < 640 ? 1.55 : 1.92;

      beeGroup.setAttribute(
        "transform",
        `translate(${smoothX.toFixed(2)}, ${smoothY.toFixed(2)}) rotate(${smoothAngle.toFixed(2)}) scale(${beeScale})`,
      );

      if (pulseRingRef.current) {
        const ringScale = 0.85 + 0.35 * Math.sin(hoverPhase * 1.1);
        pulseRingRef.current.setAttribute(
          "transform",
          `translate(${smoothX.toFixed(1)}, ${smoothY.toFixed(1)}) scale(${ringScale.toFixed(2)})`,
        );
      }

      const updateWakeSpark = (
        el: SVGGElement | null,
        lagPx: number,
        offsetY: number,
        freq: number,
      ) => {
        if (!el) return;
        const sparkDist = Math.max(0, currentDist - lagPx);
        const pt = primaryPath.getPointAtLength(sparkDist);
        const waveY = Math.sin((elapsed / 1000) * freq + lagPx) * 14;
        const pulse = 0.85 + 0.38 * Math.sin((elapsed / 1000) * freq);
        const visible = currentDist > lagPx * 0.45 ? 1 : 0;
        el.setAttribute(
          "transform",
          `translate(${pt.x.toFixed(1)}, ${(pt.y + offsetY + waveY).toFixed(1)}) scale(${(pulse * visible).toFixed(2)})`,
        );
      };

      updateWakeSpark(wakeSpark1Ref.current, 95, -28, 5.4);
      updateWakeSpark(wakeSpark2Ref.current, 195, 26, 4.5);
      updateWakeSpark(wakeSpark3Ref.current, 310, -22, 6.2);
      updateWakeSpark(wakeSpark4Ref.current, 430, 20, 4.9);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [flightPathD, flightDurationMs, loopFlight, onComplete]);

  return (
    <>
      <defs>
        <linearGradient
          id={trailGradId}
          x1="0"
          y1="0"
          x2="1440"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
        </linearGradient>

        <mask id={trailMaskId}>
          <path
            ref={maskPathRef}
            d={flightPathD}
            stroke={`url(#${trailGradId})`}
            strokeWidth="80"
            strokeLinecap="round"
            fill="none"
          />
        </mask>
      </defs>

      {backgroundLayer}

      {/* Fita Aquarela Larga de Fundo */}
      <path
        ref={secondaryRibbonRef}
        d={flightPathD}
        stroke={haloPrimary}
        strokeWidth="44"
        strokeLinecap="round"
        opacity="0.58"
      />

      {/* Segunda Fita Aquarela */}
      <path
        d={flightPathD}
        stroke={accentColor}
        strokeWidth="22"
        strokeLinecap="round"
        opacity="0.35"
        mask={`url(#${trailMaskId})`}
        transform="translate(0, -14)"
      />

      {/* Rastro Pontilhado com deslocamento físico */}
      <path
        ref={dottedPathRef}
        d={flightPathD}
        stroke={ribbonSecondary}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="2 24"
        mask={`url(#${trailMaskId})`}
        transform="translate(0, 18)"
      />

      {/* Fita Contínua Principal */}
      <path
        ref={primaryPathRef}
        d={flightPathD}
        stroke={ribbonPrimary}
        strokeWidth="11"
        strokeLinecap="round"
        opacity="0.96"
      />

      <SparkleField />

      {/* Estrelas e partículas dinâmicas perseguindo a esteira da Abelhinha */}
      <g ref={wakeSpark1Ref}>
        <path
          d="M 0 -14 L 3.6 -3.6 L 14 0 L 3.6 3.6 L 0 14 L -3.6 3.6 L -14 0 L -3.6 -3.6 Z"
          fill="#FFE07D"
        />
      </g>
      <g ref={wakeSpark2Ref}>
        <path
          d="M 0 -12 L 3 -3 L 12 0 L 3 3 L 0 12 L -3 3 L -12 0 L -3 -3 Z"
          fill="#FF9B85"
        />
      </g>
      <g ref={wakeSpark3Ref}>
        <circle r="7.5" fill="#95E1B0" />
      </g>
      <g ref={wakeSpark4Ref}>
        <path
          d="M 0 -10 L 2.5 -2.5 L 10 0 L 2.5 2.5 L 0 10 L -2.5 2.5 L -10 0 L -2.5 -2.5 Z"
          fill="#5B8DEF"
        />
      </g>

      {/* Anel de Energia Suave acompanhando a Abelhinha */}
      <circle
        ref={pulseRingRef}
        r="76"
        fill={haloPrimary}
        opacity="0.28"
      />

      {/* Abelhinha Protagonista */}
      <g ref={beeGroupRef} transform="translate(720, 405) scale(1.92)">
        <BeeVectorActor pose={pose} />
      </g>
    </>
  );
}
