"use client";

import { AnimationStageShell } from "../animation-stage-shell";
import { HONEYCOMB_CLUSTER, hexPolygonPoints } from "../bee-parts";
import { DYNAMIC_SCENE_PRESETS, type FlightAnimationProps } from "../types";
import { FlightBeeStage } from "./flight-stage";

const PLAN_CREATION_FLIGHT_PATH =
  "M -110 500 C 180 510, 280 280, 520 355 C 740 425, 810 255, 1020 355 C 1190 435, 1340 290, 1530 310";

/**
 * Cena 3 — PLAN_CREATION:
 * Constelação de 10 favos hexagonais conectados por fios animados enquanto a Abelhinha costura o plano.
 */
export function PlanCreationAnimation({
  headline,
  loopFlight = true,
  isExiting = false,
  onComplete,
  className = "",
}: FlightAnimationProps) {
  const preset = DYNAMIC_SCENE_PRESETS.PLAN_CREATION;

  const backgroundLayer = (
    <g opacity="0.96">
      {HONEYCOMB_CLUSTER.map((cell, idx) => {
        if (cell.linkTo === null) return null;
        const target = HONEYCOMB_CLUSTER[cell.linkTo];
        return (
          <line
            key={`link-${idx}`}
            x1={cell.cx}
            y1={cell.cy}
            x2={target.cx}
            y2={target.cy}
            stroke="#5B8DEF"
            strokeWidth="3.5"
            strokeDasharray="6 10"
            opacity="0.55"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="32"
              to="0"
              dur="1.4s"
              repeatCount="indefinite"
            />
          </line>
        );
      })}

      {HONEYCOMB_CLUSTER.map((cell, idx) => (
        <polygon
          key={idx}
          points={hexPolygonPoints(cell.cx, cell.cy, cell.r)}
          fill={
            idx % 3 === 0 ? "#FFF0E5" : idx % 3 === 1 ? "#E8F0FE" : "#FFFDF8"
          }
          stroke={idx % 2 === 0 ? "#FFE07D" : "#FF9B85"}
          strokeWidth="4"
          strokeLinejoin="round"
        >
          <animate
            attributeName="fill"
            values="#FFFDF8;#FFE07D;#FFF0E5;#95E1B0;#FFFDF8"
            dur="4.8s"
            begin={`${cell.delay}s`}
            repeatCount="indefinite"
          />
        </polygon>
      ))}
    </g>
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
        flightPathD={PLAN_CREATION_FLIGHT_PATH}
        pose={preset.pose}
        flightDurationMs={3200}
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
