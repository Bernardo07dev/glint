"use client";

import { AnimationStageShell } from "../animation-stage-shell";
import { HONEYCOMB_CLUSTER, hexPolygonPoints } from "../bee-parts";
import {
  DYNAMIC_SCENE_PRESETS,
  type FlightAnimationProps,
  type HomeSplashVariant,
} from "../types";
import { FlightBeeStage } from "./flight-stage";

interface HomeSplashAnimationProps extends FlightAnimationProps {
  variant: HomeSplashVariant;
}

const VARIANT_CONFIG: Record<
  HomeSplashVariant,
  {
    presetKey:
      | "HOME_SPLASH_READY"
      | "HOME_SPLASH_STREAK"
      | "HOME_SPLASH_RETURN"
      | "HOME_SPLASH_REST";
    flightPathD: string;
    flightDurationMs: number;
  }
> = {
  READY: {
    presetKey: "HOME_SPLASH_READY",
    flightPathD:
      "M -130 510 C 160 580, 290 230, 610 340 C 910 445, 960 250, 1230 325 C 1370 365, 1460 280, 1550 265",
    flightDurationMs: 3200,
  },
  STREAK: {
    presetKey: "HOME_SPLASH_STREAK",
    flightPathD:
      "M -140 520 C 210 310, 490 540, 820 340 C 1060 195, 1240 310, 1520 250",
    flightDurationMs: 2500,
  },
  RETURN: {
    presetKey: "HOME_SPLASH_RETURN",
    flightPathD:
      "M -100 420 C 220 270, 520 490, 820 355 C 1060 250, 1260 340, 1510 310",
    flightDurationMs: 3900,
  },
  REST: {
    presetKey: "HOME_SPLASH_REST",
    flightPathD:
      "M -100 420 C 220 270, 520 490, 820 355 C 1060 250, 1260 340, 1510 310",
    flightDurationMs: 3900,
  },
};

/**
 * Cena 2 — HOME_SPLASH (Entrada diária na /home):
 * Adapta a coreografia e pose da Abelhinha ao estado real do aluno (READY, STREAK, RETURN, REST),
 * sempre recebendo `headline` como prop.
 */
export function HomeSplashAnimation({
  variant,
  headline,
  loopFlight = true,
  isExiting = false,
  onComplete,
  className = "",
}: HomeSplashAnimationProps) {
  const config = VARIANT_CONFIG[variant];
  const preset = DYNAMIC_SCENE_PRESETS[config.presetKey];

  const backgroundLayer = (
    <>
      {/* Malha sutil de favos no fundo */}
      <g opacity="0.35">
        {HONEYCOMB_CLUSTER.map((cell, idx) => (
          <polygon
            key={idx}
            points={hexPolygonPoints(cell.cx, cell.cy, cell.r)}
            fill={
              idx % 3 === 0 ? "#FFF0E5" : idx % 3 === 1 ? "#E8F0FE" : "#FFFDF8"
            }
            stroke="#F3EFE6"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Variante STREAK: 5 linhas de propulsão em parallax */}
      {variant === "STREAK" && (
        <g opacity="0.72">
          {[250, 325, 415, 495, 575].map((y, idx) => (
            <line
              key={idx}
              x1="60"
              y1={y}
              x2="1380"
              y2={y}
              stroke={
                idx % 3 === 0
                  ? "#95E1B0"
                  : idx % 3 === 1
                    ? "#FFE07D"
                    : "#FF9B85"
              }
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="24 56"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-320"
                dur={`${0.85 + idx * 0.16}s`}
                repeatCount="indefinite"
              />
            </line>
          ))}
        </g>
      )}
    </>
  );

  return (
    <AnimationStageShell
      headline={headline}
      ariaLabel={`Animação Full-Screen: ${preset.sectionLabel}`}
      bgBase={preset.bgBase}
      haloPrimary={preset.haloPrimary}
      haloSecondary={preset.haloSecondary}
      isExiting={isExiting}
      className={className}
    >
      <FlightBeeStage
        flightPathD={config.flightPathD}
        pose={preset.pose}
        flightDurationMs={config.flightDurationMs}
        haloPrimary={preset.haloPrimary}
        ribbonPrimary={preset.ribbonPrimary}
        ribbonSecondary={preset.ribbonSecondary}
        accentColor={preset.accentColor}
        loopFlight={loopFlight}
        onComplete={onComplete}
        backgroundLayer={backgroundLayer}
      />
    </AnimationStageShell>
  );
}
