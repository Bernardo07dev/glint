"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft } from "@gravity-ui/icons";
import { AnimationStageShell } from "../animation-stage-shell";
import {
  FrontBeeBody,
  FrontBeeEyes,
  SparkleField,
  hexPolygonPoints,
} from "../bee-parts";
import { DYNAMIC_SCENE_PRESETS, type BaseAnimationProps } from "../types";

export interface WaitingFrontTapAnimationProps extends BaseAnimationProps {
  onBack?: () => void;
  backHref?: string;
  backLabel?: string;
}

/**
 * Animação oficial de carregamento do plano (com polling em tempo real):
 * Abelhinha de frente olhando direto para o usuário com sobrancelhas desconfiadinhas,
 * mãos na cintura e batendo o pezinho direito no compasso (~103 BPM), com botão de Voltar.
 */
export function WaitingFrontTapAnimation({
  headline,
  onBack,
  backHref,
  backLabel = "Voltar",
  isExiting = false,
  className = "",
}: WaitingFrontTapAnimationProps) {
  const preset = DYNAMIC_SCENE_PRESETS.WAITING_FRONT_TAP;

  const bodyBounceRef = useRef<SVGGElement>(null);
  const headTiltRef = useRef<SVGGElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);
  const tapFootRef = useRef<SVGGElement>(null);
  const tapRipple1Ref = useRef<SVGEllipseElement>(null);
  const tapRipple2Ref = useRef<SVGEllipseElement>(null);
  const tapSparkGroupRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const leftAntennaRef = useRef<SVGGElement>(null);
  const rightAntennaRef = useRef<SVGGElement>(null);
  const browLeftRef = useRef<SVGPathElement>(null);
  const browRightRef = useRef<SVGPathElement>(null);
  const clockHandRef = useRef<SVGLineElement>(null);
  const noteGroupRef = useRef<SVGGElement>(null);
  const mouthSmirkRef = useRef<SVGPathElement>(null);
  const mouthWhistleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    let rafId = 0;
    let startTime: number | null = null;

    const beatPeriod = 0.58;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const t = (now - startTime) / 1000;

      const beatPhase = (t % beatPeriod) / beatPeriod;

      let footAngle = 0;
      let footLiftY = 0;
      if (beatPhase < 0.52) {
        const u = beatPhase / 0.52;
        const liftCurve = Math.sin(u * Math.PI * 0.88);
        footAngle = 25 * liftCurve;
        footLiftY = -4.5 * liftCurve;
      } else if (beatPhase < 0.68) {
        const u = (beatPhase - 0.52) / 0.16;
        const slam = 1 - u * u;
        footAngle = 25 * slam;
        footLiftY = -4.5 * slam;
      } else {
        const u = (beatPhase - 0.68) / 0.32;
        footAngle = -2.2 * Math.sin(u * Math.PI);
        footLiftY = 0;
      }

      const timeSinceStrike =
        beatPhase >= 0.66 ? beatPhase - 0.66 : beatPhase + (1 - 0.66);

      const impactBounce =
        Math.exp(-timeSinceStrike * 7.5) * Math.sin(timeSinceStrike * 22);
      const bodyY =
        -Math.abs(Math.sin(beatPhase * Math.PI)) * 3.2 + impactBounce * 3.8;
      const bodyScaleY = 1 - impactBounce * 0.028;
      const bodyScaleX = 1 + impactBounce * 0.022;

      const swayAngle = Math.sin(t * 1.65) * 2.6;
      const headTilt = Math.sin(t * 1.65 - 0.4) * 3.8 + 2.5;

      const lookCycle = t % 6.4;
      let pupilX = 0;
      let pupilY = 0;
      let browRightLift = Math.sin(beatPhase * Math.PI) * -1.4;
      let browLeftDrop = Math.sin(beatPhase * Math.PI) * 0.9;
      let isWhistling = false;

      if (lookCycle > 1.8 && lookCycle < 3.1) {
        const s = Math.sin(((lookCycle - 1.8) / 1.3) * Math.PI);
        pupilX = 2.8 * s;
        pupilY = -1.2 * s;
        browRightLift = -3.8 * s;
        browLeftDrop = 2.2 * s;
        isWhistling = s > 0.48;
      } else if (lookCycle > 4.3 && lookCycle < 5.4) {
        const s = Math.sin(((lookCycle - 4.3) / 1.1) * Math.PI);
        pupilX = -3.0 * s;
        pupilY = 1.0 * s;
        browRightLift = -3.4 * s;
        browLeftDrop = 2.4 * s;
      }

      if (mouthSmirkRef.current && mouthWhistleRef.current) {
        mouthSmirkRef.current.setAttribute("opacity", isWhistling ? "0" : "1");
        mouthWhistleRef.current.setAttribute("opacity", isWhistling ? "1" : "0");
      }

      if (noteGroupRef.current) {
        const notePhase = (t * 0.85) % 1;
        const noteX = 52 + Math.sin(notePhase * Math.PI * 2) * 10;
        const noteY = -36 - notePhase * 42;
        const noteOp = Math.sin(notePhase * Math.PI) * 0.92;
        noteGroupRef.current.setAttribute(
          "transform",
          `translate(${noteX.toFixed(1)}, ${noteY.toFixed(1)}) scale(${(0.75 + notePhase * 0.35).toFixed(2)})`,
        );
        noteGroupRef.current.setAttribute("opacity", noteOp.toFixed(2));
      }

      if (bodyBounceRef.current) {
        bodyBounceRef.current.setAttribute(
          "transform",
          `translate(0, ${bodyY.toFixed(2)}) rotate(${swayAngle.toFixed(2)}) scale(${bodyScaleX.toFixed(3)}, ${bodyScaleY.toFixed(3)})`,
        );
      }

      if (headTiltRef.current) {
        headTiltRef.current.setAttribute(
          "transform",
          `rotate(${(headTilt * 0.45).toFixed(2)})`,
        );
      }

      if (pupilsRef.current) {
        pupilsRef.current.setAttribute(
          "transform",
          `translate(${pupilX.toFixed(2)}, ${pupilY.toFixed(2)})`,
        );
      }

      if (browLeftRef.current) {
        browLeftRef.current.setAttribute(
          "transform",
          `translate(0, ${browLeftDrop.toFixed(2)})`,
        );
      }

      if (browRightRef.current) {
        browRightRef.current.setAttribute(
          "transform",
          `translate(0, ${browRightLift.toFixed(2)})`,
        );
      }

      const antWaveL = Math.sin(t * 5.4 - 0.5) * 6 + impactBounce * 8;
      const antWaveR = Math.cos(t * 5.4 - 0.3) * 7 - impactBounce * 9;
      if (leftAntennaRef.current) {
        leftAntennaRef.current.setAttribute(
          "transform",
          `translate(-18, -74) rotate(${antWaveL.toFixed(2)})`,
        );
      }
      if (rightAntennaRef.current) {
        rightAntennaRef.current.setAttribute(
          "transform",
          `translate(18, -74) rotate(${antWaveR.toFixed(2)})`,
        );
      }

      if (tapFootRef.current) {
        tapFootRef.current.setAttribute(
          "transform",
          `translate(0, ${footLiftY.toFixed(2)}) rotate(${(-footAngle).toFixed(2)} 14 102)`,
        );
      }

      if (shadowRef.current) {
        const shRx = 82 + impactBounce * 6;
        shadowRef.current.setAttribute("rx", shRx.toFixed(1));
      }

      if (tapRipple1Ref.current) {
        const rProg = Math.min(timeSinceStrike / 0.75, 1);
        const rx = 12 + rProg * 54;
        const ry = 4 + rProg * 14;
        const op = (1 - rProg) * 0.78;
        tapRipple1Ref.current.setAttribute("rx", rx.toFixed(1));
        tapRipple1Ref.current.setAttribute("ry", ry.toFixed(1));
        tapRipple1Ref.current.setAttribute("opacity", op.toFixed(2));
      }

      if (tapRipple2Ref.current) {
        const rProg2 = Math.min(Math.max(0, timeSinceStrike - 0.12) / 0.75, 1);
        const rx2 = 8 + rProg2 * 38;
        const ry2 = 3 + rProg2 * 10;
        const op2 = (1 - rProg2) * 0.55;
        tapRipple2Ref.current.setAttribute("rx", rx2.toFixed(1));
        tapRipple2Ref.current.setAttribute("ry", ry2.toFixed(1));
        tapRipple2Ref.current.setAttribute("opacity", op2.toFixed(2));
      }

      if (tapSparkGroupRef.current) {
        const pop = Math.max(0, 1 - timeSinceStrike / 0.36);
        const popLift = (1 - pop) * -14;
        tapSparkGroupRef.current.setAttribute(
          "transform",
          `translate(56, ${(94 + popLift).toFixed(1)}) scale(${(0.5 + pop * 0.75).toFixed(2)})`,
        );
        tapSparkGroupRef.current.setAttribute("opacity", pop.toFixed(2));
      }

      if (clockHandRef.current) {
        const deg = (t * 95) % 360;
        clockHandRef.current.setAttribute("transform", `rotate(${deg.toFixed(1)})`);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const backButtonClass =
    "inline-flex items-center gap-2 rounded-full bg-[#FFFDF8]/95 border-2 border-[#F3EFE6] px-4 py-2 text-xs sm:text-sm font-semibold text-[#2D3142] shadow-[0_6px_18px_-8px_rgba(45,49,66,0.12)] transition-colors hover:bg-[#E8F0FE] cursor-pointer";

  const backAction = onBack ? (
    <button type="button" onClick={onBack} className={backButtonClass}>
      <ArrowLeft className="size-4" />
      <span>{backLabel}</span>
    </button>
  ) : backHref ? (
    <Link href={backHref} className={backButtonClass}>
      <ArrowLeft className="size-4" />
      <span>{backLabel}</span>
    </Link>
  ) : null;

  return (
    <AnimationStageShell
      headline={headline}
      ariaLabel={`Animação Full-Screen: ${preset.sectionLabel}`}
      bgBase={preset.bgBase}
      haloPrimary={preset.haloPrimary}
      haloSecondary={preset.haloSecondary}
      topLeftAction={backAction}
      isExiting={isExiting}
      className={className}
    >
      {/* Palco Aquarela Central: Anéis rítmicos suaves atrás da Abelhinha */}
      <g transform="translate(720, 485)">
        <circle r="275" fill="#FFF0E5" opacity="0.58" />
        <circle
          r="225"
          stroke="#FFE07D"
          strokeWidth="3.5"
          strokeDasharray="10 18"
          opacity="0.7"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="28s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r="175" fill="#FFE07D" opacity="0.22" />
      </g>

      {/* Favos decorativos suaves nas laterais */}
      <g opacity="0.55">
        {[
          { cx: 250, cy: 360, r: 58, fill: "#FFF0E5", stroke: "#FFE07D" },
          { cx: 345, cy: 435, r: 44, fill: "#E8F0FE", stroke: "#5B8DEF" },
          { cx: 1190, cy: 350, r: 62, fill: "#E8F0FE", stroke: "#5B8DEF" },
          { cx: 1095, cy: 440, r: 46, fill: "#FFF0E5", stroke: "#FF9B85" },
        ].map((h, i) => (
          <polygon
            key={i}
            points={hexPolygonPoints(h.cx, h.cy, h.r)}
            fill={h.fill}
            stroke={h.stroke}
            strokeWidth="3"
            strokeOpacity="0.45"
            strokeLinejoin="round"
          />
        ))}
      </g>

      <SparkleField />

      {/* Reloginho fofo flutuando ao lado esquerdo */}
      <g transform="translate(495, 345)" className="animate-gentle-float">
        <circle r="34" fill="#FFFDF8" stroke="#5B8DEF" strokeWidth="5" />
        <circle r="26" fill="#E8F0FE" opacity="0.65" />
        <path
          d="M -24 -26 Q -32 -36 -16 -36"
          stroke="#FF9B85"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 24 -26 Q 32 -36 16 -36"
          stroke="#FF9B85"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="-14"
          stroke="#2D3142"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          ref={clockHandRef}
          x1="0"
          y1="0"
          x2="13"
          y2="0"
          stroke="#FF9B85"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle r="3.5" fill="#2D3142" />
      </g>

      {/* Balãozinho "..." flutuando à direita da cabeça */}
      <g transform="translate(935, 330)" className="animate-gentle-float">
        <rect
          x="-42"
          y="-24"
          width="84"
          height="46"
          rx="23"
          fill="#FFFDF8"
          stroke="#FF9B85"
          strokeWidth="3.5"
        />
        <circle cx="-34" cy="28" r="6" fill="#FFFDF8" stroke="#FF9B85" strokeWidth="3" />
        <circle cx="-18" cy="-1" r="5" fill="#5B8DEF">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0s" repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="-1" r="5" fill="#5B8DEF">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.25s" repeatCount="indefinite" />
        </circle>
        <circle cx="18" cy="-1" r="5" fill="#FF9B85">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Abelhinha de frente proporcional (scale 1.72) */}
      <g transform="translate(720, 495) scale(1.72)">
        <ellipse
          ref={shadowRef}
          cx="0"
          cy="108"
          rx="82"
          ry="15"
          fill="#E8E1D3"
          opacity="0.75"
        />

        <ellipse
          ref={tapRipple1Ref}
          cx="38"
          cy="107"
          rx="22"
          ry="6"
          stroke="#FF9B85"
          strokeWidth="2.8"
          fill="none"
          opacity="0"
        />
        <ellipse
          ref={tapRipple2Ref}
          cx="38"
          cy="107"
          rx="14"
          ry="4"
          stroke="#5B8DEF"
          strokeWidth="2.2"
          fill="none"
          opacity="0"
        />

        <g ref={tapSparkGroupRef} transform="translate(56, 94)" opacity="0">
          <line x1="0" y1="0" x2="9" y2="-6" stroke="#FF9B85" strokeWidth="3" strokeLinecap="round" />
          <line x1="3" y1="6" x2="13" y2="5" stroke="#5B8DEF" strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="-2" cy="-7" r="2.6" fill="#FFE07D" />
        </g>

        {/* Perninha esquerda plantada firme */}
        <g>
          <path
            d="M -22 62 Q -26 82 -24 98"
            stroke="#2D3142"
            strokeWidth="7.5"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="-29" cy="102" rx="15" ry="7.5" fill="#2D3142" />
          <ellipse cx="-32" cy="100" rx="5.5" ry="2.3" fill="#646B82" opacity="0.55" />
        </g>

        {/* Perninha direita batendo o pé */}
        <g>
          <path
            d="M 18 62 Q 20 82 16 99"
            stroke="#2D3142"
            strokeWidth="7.5"
            strokeLinecap="round"
            fill="none"
          />
          <g ref={tapFootRef}>
            <ellipse cx="29" cy="102" rx="16.5" ry="8" fill="#2D3142" />
            <path
              d="M 16 106 Q 30 110 43 105"
              stroke="#FF9B85"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse cx="34" cy="99.5" rx="6" ry="2.4" fill="#FFFDF8" opacity="0.45" />
          </g>
        </g>

        <g ref={bodyBounceRef}>
          {/* Asas Pistache */}
          <g>
            <ellipse
              cx="-66"
              cy="-12"
              rx="34"
              ry="19"
              transform="rotate(-18 -66 -12)"
              fill="#95E1B0"
              stroke="#7AD39B"
              strokeWidth="2"
            />
            <ellipse
              cx="-58"
              cy="14"
              rx="25"
              ry="14"
              transform="rotate(12 -58 14)"
              fill="#95E1B0"
              opacity="0.82"
            />
            <ellipse
              cx="66"
              cy="-12"
              rx="34"
              ry="19"
              transform="rotate(18 66 -12)"
              fill="#95E1B0"
              stroke="#7AD39B"
              strokeWidth="2"
            />
            <ellipse
              cx="58"
              cy="14"
              rx="25"
              ry="14"
              transform="rotate(-12 58 14)"
              fill="#95E1B0"
              opacity="0.82"
            />
          </g>

          <FrontBeeBody />

          {/* Bracinhos na cintura */}
          <path
            d="M -52 2 C -76 14, -76 38, -48 44"
            stroke="#2D3142"
            strokeWidth="7.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="-46" cy="44" r="6.5" fill="#2D3142" />
          <path
            d="M 52 2 C 76 14, 76 38, 48 44"
            stroke="#2D3142"
            strokeWidth="7.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="46" cy="44" r="6.5" fill="#2D3142" />

          <g ref={headTiltRef}>
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

            {/* Sobrancelhas desconfiadinhas */}
            <path
              ref={browLeftRef}
              d="M -31 -37.5 Q -21 -36 -11 -33.5"
              stroke="#2D3142"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              ref={browRightRef}
              d="M 10 -36.5 C 15 -45.5, 25 -46.5, 32 -39.5"
              stroke="#2D3142"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />

            <g className="animate-bee-blink">
              <g ref={pupilsRef}>
                <FrontBeeEyes />
              </g>
            </g>

            <ellipse cx="-33" cy="-4.5" rx="7.5" ry="4.4" fill="#FF9B85" opacity="0.88" />
            <ellipse cx="33" cy="-4.5" rx="7.5" ry="4.4" fill="#FF9B85" opacity="0.88" />

            <path
              ref={mouthSmirkRef}
              d="M -4.5 -3.5 Q 2.5 0.5 8.5 -5.5"
              stroke="#2D3142"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            <circle
              ref={mouthWhistleRef}
              cx="2"
              cy="-4"
              r="2.6"
              fill="#2D3142"
              opacity="0"
            />

            <g ref={noteGroupRef} opacity="0">
              <circle cx="0" cy="0" r="4" fill="#5B8DEF" />
              <circle cx="11" cy="-3" r="4" fill="#5B8DEF" />
              <path
                d="M 3 0 L 3 -13 L 14 -16 L 14 -3"
                stroke="#5B8DEF"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          </g>
        </g>
      </g>
    </AnimationStageShell>
  );
}
