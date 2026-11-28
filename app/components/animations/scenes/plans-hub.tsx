"use client";

import { AnimationStageShell } from "../animation-stage-shell";
import { HONEYCOMB_CLUSTER, hexPolygonPoints } from "../bee-parts";
import { DYNAMIC_SCENE_PRESETS, type FlightAnimationProps } from "../types";
import { FlightBeeStage } from "./flight-stage";

const PLANS_HUB_FLIGHT_PATH =
  "M -110 560 C 140 560, 240 460, 450 465 C 660 470, 720 335, 960 335 C 1160 335, 1310 250, 1530 240";

const MILESTONE_NODES = [
  { x: 230, y: 525, done: true },
  { x: 450, y: 465, done: true },
  { x: 710, y: 395, done: true },
  { x: 960, y: 335, done: false },
];

/**
 * Cena 4 — PLANS_HUB:
 * Trilha sinuosa ascendente com marcos concluídos em Pistache (#95E1B0) e marco atual pulsando em Cobalto (#5B8DEF).
 */
export function PlansHubAnimation({
  headline,
  loopFlight = true,
  isExiting = false,
  onComplete,
  className = "",
}: FlightAnimationProps) {
  const preset = DYNAMIC_SCENE_PRESETS.PLANS_HUB;

  const backgroundLayer = (
    <>
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

      <g>
        {MILESTONE_NODES.map((node, i) => (
          <g key={i} transform={`translate(${node.x}, ${node.y})`}>
            <circle
              r={node.done ? 32 : 44}
              fill={node.done ? "#95E1B0" : "#5B8DEF"}
              opacity="0.28"
              className={node.done ? "" : "animate-ring-expand"}
            />
            <circle
              r={node.done ? 18 : 22}
              fill={node.done ? "#95E1B0" : "#5B8DEF"}
              stroke="#FFFDF8"
              strokeWidth="5"
            />
            {node.done && (
              <path
                d="M -6 0 L -1.5 4.5 L 7 -4.5"
                stroke="#2D3142"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        ))}
      </g>
    </>
  );

  return (
    <AnimationStageShell
      headline={headline}
      ariaLabel={`Animação Full-Screen: ${preset.sectionLabel}`}
      bgBase={preset.bgBase}
      haloPrimary={preset.haloPrimary}
      haloSecondary={preset.haloSecondary}
      haloCenter="#95E1B0"
      isExiting={isExiting}
      className={className}
    >
      <FlightBeeStage
        flightPathD={PLANS_HUB_FLIGHT_PATH}
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
