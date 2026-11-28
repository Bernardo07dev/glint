"use client";

import { useId } from "react";
import type { BeeScenePose } from "./types";

export function hexPolygonPoints(cx: number, cy: number, radius: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export const HONEYCOMB_CLUSTER = [
  { cx: 340, cy: 360, r: 64, delay: 0.0, linkTo: 1 },
  { cx: 455, cy: 300, r: 54, delay: 0.25, linkTo: 2 },
  { cx: 580, cy: 375, r: 68, delay: 0.5, linkTo: 3 },
  { cx: 720, cy: 315, r: 74, delay: 0.75, linkTo: 4 },
  { cx: 865, cy: 385, r: 66, delay: 1.0, linkTo: 5 },
  { cx: 995, cy: 310, r: 58, delay: 1.25, linkTo: 6 },
  { cx: 1110, cy: 370, r: 62, delay: 1.5, linkTo: null },
  { cx: 495, cy: 485, r: 50, delay: 0.4, linkTo: 2 },
  { cx: 720, cy: 475, r: 58, delay: 0.9, linkTo: 4 },
  { cx: 950, cy: 480, r: 52, delay: 1.35, linkTo: 5 },
];

export const SPARKLE_POSITIONS = [
  { x: 210, y: 240, size: 16, color: "#FFE07D" },
  { x: 460, y: 195, size: 13, color: "#FF9B85" },
  { x: 730, y: 175, size: 18, color: "#FFE07D" },
  { x: 1020, y: 205, size: 15, color: "#95E1B0" },
  { x: 1240, y: 260, size: 17, color: "#FF9B85" },
  { x: 260, y: 540, size: 15, color: "#95E1B0" },
  { x: 590, y: 560, size: 14, color: "#5B8DEF" },
  { x: 890, y: 550, size: 16, color: "#FFE07D" },
  { x: 1180, y: 520, size: 14, color: "#FF9B85" },
];

export function SparkleField() {
  return (
    <>
      {SPARKLE_POSITIONS.map((star, idx) => (
        <g
          key={idx}
          transform={`translate(${star.x}, ${star.y})`}
          className="animate-star-pulse"
          style={{ animationDelay: `${idx * 220}ms` }}
        >
          <path
            d={`M 0 -${star.size} L ${star.size * 0.27} -${star.size * 0.27} L ${star.size} 0 L ${star.size * 0.27} ${star.size * 0.27} L 0 ${star.size} L -${star.size * 0.27} ${star.size * 0.27} L -${star.size} 0 L -${star.size * 0.27} -${star.size * 0.27} Z`}
            fill={star.color}
            opacity="0.92"
          />
        </g>
      ))}
    </>
  );
}

/**
 * Corpo cápsula gordinho da Abelhinha frontal (#FFE07D) com listras 3D (#5B8DEF).
 */
export function FrontBeeBody() {
  const uid = useId().replace(/:/g, "");
  const clipId = `front-bee-body-clip-${uid}`;

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x="-56" y="-72" width="112" height="142" rx="56" />
        </clipPath>
      </defs>
      <rect x="-56" y="-72" width="112" height="142" rx="56" fill="#FFE07D" />
      <g clipPath={`url(#${clipId})`}>
        <ellipse cx="0" cy="-68" rx="52" ry="18" fill="#FFFDF8" opacity="0.35" />
        <path d="M -64 16 Q 0 30 64 16 L 64 34 Q 0 48 -64 34 Z" fill="#5B8DEF" />
        <path d="M -64 44 Q 0 58 64 44 L 64 60 Q 0 74 -64 60 Z" fill="#5B8DEF" />
      </g>
      <rect
        x="-56"
        y="-72"
        width="112"
        height="142"
        rx="56"
        stroke="#F2CC59"
        strokeWidth="2.5"
        fill="none"
      />
    </>
  );
}

/**
 * Olhinhos característicos originais da Bee (círculos escuros com brilho único limpo).
 */
export function FrontBeeEyes() {
  return (
    <>
      <circle cx="-21" cy="-19" r="8.2" fill="#2D3142" />
      <circle cx="-18.5" cy="-21.8" r="2.8" fill="#FFFDF8" />

      <circle cx="21" cy="-19" r="8.2" fill="#2D3142" />
      <circle cx="23.5" cy="-21.8" r="2.8" fill="#FFFDF8" />
    </>
  );
}

/**
 * Renderizador SVG das poses oficiais da Abelhinha de Perfil (steering/ANIMATIONS.md)
 * para voo em grande escala no palco Full-Screen.
 */
export function BeeVectorActor({ pose }: { pose: BeeScenePose }) {
  const isFocus = pose === "focus";
  const isStreak = pose === "streak";
  const isCelebrating = pose === "celebrating";
  const isCurious34 = pose === "curious_34";
  const isSleepy = pose === "sleepy";

  return (
    <g>
      {/* Halo solar suave atrás da abelha */}
      <circle cx="-18" cy="4" r="26" fill="#FFE07D" opacity="0.42" />

      {/* Pose 3 (Streak): Trilhas tracejadas de alta velocidade */}
      {isStreak && (
        <g stroke="#FF9B85" strokeWidth="3" strokeLinecap="round">
          <line x1="-68" y1="-11" x2="-32" y2="-11" strokeDasharray="4 7">
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="22"
              dur="0.32s"
              repeatCount="indefinite"
            />
          </line>
          <line x1="-80" y1="2" x2="-34" y2="2" strokeDasharray="5 8">
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="26"
              dur="0.28s"
              repeatCount="indefinite"
            />
          </line>
          <line x1="-64" y1="14" x2="-30" y2="14" strokeDasharray="4 7">
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="22"
              dur="0.35s"
              repeatCount="indefinite"
            />
          </line>
        </g>
      )}

      {/* Faísca de 4 pontas na cauda */}
      <path
        d="M -38 2 L -35.5 -3.5 L -30 -6 L -35.5 -8.5 L -38 -14 L -40.5 -8.5 L -46 -6 L -40.5 -3.5 Z"
        fill={isStreak ? "#FFE07D" : "#FF9B85"}
        className="animate-star-pulse"
      />

      {/* Pose 4 (Comemorando): Explosão de estrelas e bolinhas Pistache ao redor */}
      {isCelebrating && (
        <g className="animate-star-pulse">
          <path
            d="M 38 -22 L 40.5 -27.5 L 46 -30 L 40.5 -32.5 L 38 -38 L 35.5 -32.5 L 30 -30 L 35.5 -27.5 Z"
            fill="#FFE07D"
          />
          <path
            d="M -28 -28 L -26 -32.5 L -21.5 -34.5 L -26 -36.5 L -28 -41 L -30 -36.5 L -34.5 -34.5 L -30 -32.5 Z"
            fill="#FF9B85"
          />
          <circle cx="44" cy="14" r="4.5" fill="#95E1B0" />
          <circle cx="-32" cy="-16" r="4" fill="#95E1B0" />
        </g>
      )}

      {/* Asas Pistache Claro (#95E1B0) */}
      <ellipse
        cx="-8"
        cy="-22"
        rx="18"
        ry="10.5"
        transform={
          isSleepy
            ? "rotate(-32 -8 -22)"
            : isStreak
              ? "rotate(-28 -8 -22)"
              : "rotate(-16 -8 -22)"
        }
        fill="#95E1B0"
        opacity={isSleepy ? 0.72 : 1}
        className={isSleepy ? "" : "animate-wing-beat"}
      />
      <ellipse
        cx="7"
        cy="-20"
        rx="14"
        ry="8.5"
        transform={
          isSleepy
            ? "rotate(-18 7 -20)"
            : isStreak
              ? "rotate(-8 7 -20)"
              : "rotate(14 7 -20)"
        }
        fill="#95E1B0"
        opacity={isSleepy ? 0.65 : 0.84}
        className={isSleepy ? "" : "animate-wing-beat"}
      />

      {/* Corpo cápsula Manteiga Solar (#FFE07D) */}
      <rect x="-26" y="-14" width="52" height="36" rx="18" fill="#FFE07D" />

      {/* Duas listras Cobalto Pastel (#5B8DEF) */}
      <path
        d="M -9 -13.5 L -9 21.5 M 4 -13.5 L 4 21.5"
        stroke="#5B8DEF"
        strokeWidth="6.5"
      />

      {/* Rosto: 3/4 olhando para o aluno (Pose 5C) vs Perfil */}
      {isCurious34 ? (
        <>
          <g className="animate-bee-blink">
            <circle cx="10.5" cy="0" r="3.6" fill="#2D3142" />
            <circle cx="11.6" cy="-1.3" r="1.3" fill="#FFFDF8" />
            <ellipse cx="21" cy="-0.3" rx="2.8" ry="3.4" fill="#2D3142" />
            <circle cx="21.8" cy="-1.5" r="1.1" fill="#FFFDF8" />
          </g>
          <ellipse cx="7.5" cy="7" rx="3" ry="1.8" fill="#FF9B85" />
          <ellipse cx="23.5" cy="6.6" rx="1.9" ry="1.5" fill="#FF9B85" />
          <path
            d="M 13 7.5 Q 15.8 10.2 18.6 7.5"
            stroke="#2D3142"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <g transform="translate(42, -22)" className="animate-question-tilt">
            <path
              d="M -4 -8 C -4 -13, 4 -13, 4 -8 C 4 -4, 0 -3, 0 1"
              stroke="#5B8DEF"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="0" cy="6" r="1.9" fill="#5B8DEF" />
          </g>
        </>
      ) : (
        <>
          {isSleepy ? (
            <path
              d="M 12.5 1 Q 16.5 4.8 20.5 1"
              stroke="#2D3142"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
          ) : isCelebrating || isStreak ? (
            <path
              d="M 12.5 1.5 Q 16.8 -3.5 21 1.5"
              stroke="#2D3142"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <g className="animate-bee-blink">
              <circle cx="16.5" cy="0.5" r="4.2" fill="#2D3142" />
              <circle cx="18.2" cy="-1" r="1.6" fill="#FFFDF8" />
            </g>
          )}

          {isFocus && (
            <g>
              <line
                x1="1"
                y1="-1"
                x2="9"
                y2="-1"
                stroke="#FF9B85"
                strokeWidth="2.3"
                strokeLinecap="round"
              />
              <circle
                cx="16.5"
                cy="0.5"
                r="7.5"
                fill="#FFFDF8"
                fillOpacity="0.42"
                stroke="#FF9B85"
                strokeWidth="2.4"
              />
              <path
                d="M 12.5 -4.5 Q 14.5 -6 17 -5"
                stroke="#FFFDF8"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <g transform="translate(34, 10)" className="animate-gentle-float">
                <path d="M 0 0 L 12 -4 L 12 10 L 0 14 Z" fill="#5B8DEF" />
                <path d="M 0 0 L -10 -3 L -10 11 L 0 14 Z" fill="#4A7BD9" />
                <path d="M 1 -1.5 L 10.5 -4.5 L 10.5 8 L 1 11 Z" fill="#E8F0FE" />
              </g>
            </g>
          )}

          <ellipse cx="14.5" cy="7.5" rx="4" ry="2.4" fill="#FF9B85" />
          {isCelebrating ? (
            <path
              d="M 19.5 4.5 Q 23.5 9.5 26.5 4.5 Z"
              fill="#FF9B85"
              stroke="#2D3142"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M 20.5 5.2 Q 24.2 7.5 25.8 4.4"
              stroke="#2D3142"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </>
      )}

      {isSleepy ? (
        <>
          <path
            d="M 18 -11 Q 26 -16 32 -9"
            stroke="#2D3142"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="33" cy="-8.5" r="3.6" fill="#FFE07D" />
          <g transform="translate(40, -22)" className="animate-gentle-float">
            <path
              d="M -6 -2 L 1 -2 L -6 5 L 1 5"
              stroke="#5B8DEF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 6 -13 L 15 -13 L 6 -4 L 15 -4"
              stroke="#FF9B85"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        </>
      ) : (
        <>
          <path
            d="M 18 -11 Q 25 -24 33 -20"
            stroke="#2D3142"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <circle
            cx="34"
            cy="-20"
            r="3.8"
            fill={isFocus ? "#FFE07D" : "#FF9B85"}
          />
        </>
      )}
    </g>
  );
}
