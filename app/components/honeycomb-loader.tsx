"use client";

import { useEffect, useState } from "react";
import { pickNextPhrase } from "@/app/api/plan/random-loaders";

interface HoneycombLoaderProps {
  phrases: readonly string[];
  intervalMs?: number;
}

/**
 * Loader da criação do plano:
 * a abelhinha voa em órbita ao redor de uma colmeia e enche de mel
 * cada favo por onde passa, enquanto fala frases da etapa atual.
 */

const CELL_RADIUS = 13;
const CELL_GAP = 2.5;
const NEIGHBOR_DISTANCE = Math.sqrt(3) * CELL_RADIUS + CELL_GAP;
const ORBIT_RADIUS = NEIGHBOR_DISTANCE + CELL_RADIUS + 8;
const ORBIT_SECONDS = 4.2;

// Favos externos em sentido horário, começando no topo (onde a abelha começa)
const OUTER_CELL_ANGLES = [-90, -30, 30, 90, 150, 210];
const SECONDS_PER_CELL = ORBIT_SECONDS / OUTER_CELL_ANGLES.length;

function hexPoints(cx: number, cy: number, radius: number): string {
  return Array.from({ length: 6 }, (_, k) => {
    const angle = (Math.PI / 180) * 60 * k;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

const OUTER_CELLS = OUTER_CELL_ANGLES.map((degrees) => {
  const angle = (Math.PI / 180) * degrees;
  return {
    x: NEIGHBOR_DISTANCE * Math.cos(angle),
    y: NEIGHBOR_DISTANCE * Math.sin(angle),
  };
});

export function HoneycombLoader({
  phrases,
  intervalMs = 2800,
}: HoneycombLoaderProps) {
  const [phrase, setPhrase] = useState(phrases[0]);
  const displayPhrase = phrases.includes(phrase) ? phrase : phrases[0];

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const showNextPhrase = (delay: number) => {
      timeoutId = setTimeout(() => {
        setPhrase((current) => pickNextPhrase(phrases, current));
        showNextPhrase(intervalMs);
      }, delay);
    };

    showNextPhrase(0);
    return () => clearTimeout(timeoutId);
  }, [phrases, intervalMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-64 -64 128 128"
        fill="none"
        className="w-40 h-40"
        aria-hidden="true"
      >
        {/* Rastro pontilhado da órbita */}
        <circle
          r={ORBIT_RADIUS}
          stroke="#FF9B85"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="0.5 8"
          opacity="0.55"
        />

        {/* Favo central com a faísca */}
        <polygon
          points={hexPoints(0, 0, CELL_RADIUS)}
          fill="#FFF0E5"
          stroke="#F3EFE6"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M 0 -6 L 1.6 -1.6 L 6 0 L 1.6 1.6 L 0 6 L -1.6 1.6 L -6 0 L -1.6 -1.6 Z"
          fill="#FF9B85"
          className="animate-star-pulse"
        />

        {/* Favos externos que enchem de mel quando a abelha passa */}
        {OUTER_CELLS.map((cell, index) => (
          <polygon
            key={index}
            points={hexPoints(cell.x, cell.y, CELL_RADIUS)}
            fill="#FFFDF8"
            stroke="#F3EFE6"
            strokeWidth="2"
            strokeLinejoin="round"
          >
            <animate
              attributeName="fill"
              values="#FFFDF8;#FFE07D;#FFE07D;#FFFDF8;#FFFDF8"
              keyTimes="0;0.06;0.8;0.95;1"
              dur={`${ORBIT_SECONDS}s`}
              begin={`${(index * SECONDS_PER_CELL).toFixed(2)}s`}
              repeatCount="indefinite"
            />
          </polygon>
        ))}

        {/* Abelhinha em órbita */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur={`${ORBIT_SECONDS}s`}
            repeatCount="indefinite"
          />
          <g transform={`translate(0, ${-ORBIT_RADIUS}) scale(0.55)`}>
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -3; 0 0"
                dur="0.6s"
                repeatCount="indefinite"
              />

              {/* Asas Pistache */}
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

              {/* Corpo cápsula Manteiga Solar + listras Cobalto */}
              <rect x="-24" y="-13" width="48" height="33" rx="16.5" fill="#FFE07D" />
              <path
                d="M -8 -12.5 L -8 19.5 M 4 -12.5 L 4 19.5"
                stroke="#5B8DEF"
                strokeWidth="6"
              />

              {/* Olho, bochecha e sorriso */}
              <circle cx="15" cy="0.5" r="3.9" fill="#2D3142" />
              <circle cx="16.4" cy="-0.9" r="1.4" fill="#FFFDF8" />
              <ellipse cx="13.2" cy="7" rx="3.6" ry="2.2" fill="#FF9B85" />
              <path
                d="M 19.5 5 Q 22.8 7 24.2 4.2"
                stroke="#2D3142"
                strokeWidth="1.9"
                strokeLinecap="round"
              />

              {/* Antena */}
              <path
                d="M 16.5 -10 Q 23 -22 30.5 -18.5"
                stroke="#2D3142"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <circle cx="31.5" cy="-18.5" r="3.5" fill="#FF9B85" />
            </g>
          </g>
        </g>
      </svg>

      {/* Balão de fala da abelhinha */}
      <div className="relative max-w-[36ch] rounded-2xl bg-[#FFF0E5] px-4 py-2.5">
        <span
          aria-hidden="true"
          className="absolute left-1/2 -top-1.5 size-2.5 -translate-x-1/2 rotate-45 bg-[#FFF0E5]"
        />
        <p
          key={displayPhrase}
          className="animate-phrase-in relative min-h-[1.25rem] text-center font-display text-xs sm:text-sm text-[#2D3142]"
        >
          {displayPhrase}
        </p>
      </div>
    </div>
  );
}
