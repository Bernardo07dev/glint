"use client";

interface MascotBeeProps {
  pose?: "standard" | "curious";
  className?: string;
}

/**
 * Mascote Abelhinha de Perfil (ANIMATIONS.md):
 * - standard (Pose 1): saudação e estados neutros
 * - curious (Pose 5): entrevista inicial e convite de novos alunos (?)
 */
export function MascotBee({
  pose = "standard",
  className = "h-20 w-24",
}: MascotBeeProps) {
  const isCurious = pose === "curious";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 132 104"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g
        transform={
          isCurious
            ? "translate(58, 56) rotate(4)"
            : "translate(60, 56) rotate(0)"
        }
        className="transition-transform duration-300 ease-out"
      >
        <g className="animate-gentle-float">
          {/* Brilho suave Manteiga Solar atrás da cauda */}
          <circle cx="-18" cy="6" r="18" fill="#FFE07D" opacity="0.35" />

          {/* Faísca de 4 pontas na cauda */}
          <path
            d="M -36 2 L -34 -3 L -29 -5 L -34 -7 L -36 -12 L -38 -7 L -43 -5 L -38 -3 Z"
            fill="#FF9B85"
            className="animate-star-pulse"
          />

          {/* Asas Pistache */}
          <ellipse
            cx="-8"
            cy="-22"
            rx="18"
            ry="10.5"
            transform="rotate(-16 -8 -22)"
            fill="#95E1B0"
            className="animate-wing-beat"
          />
          <ellipse
            cx="7"
            cy="-20"
            rx="14"
            ry="8.5"
            transform="rotate(14 7 -20)"
            fill="#95E1B0"
            opacity="0.8"
            className="animate-wing-beat"
          />

          {/* Corpo cápsula Manteiga Solar */}
          <rect x="-26" y="-14" width="52" height="36" rx="18" fill="#FFE07D" />

          {/* Duas listras Cobalto Pastel */}
          <path
            d="M -9 -13.5 L -9 21.5 M 4 -13.5 L 4 21.5"
            stroke="#5B8DEF"
            strokeWidth="6.5"
          />

          {/* Olho de perfil */}
          <circle
            cx="16.5"
            cy={isCurious ? -1 : 0.5}
            r="4.2"
            fill="#2D3142"
          />
          <circle
            cx="18"
            cy={isCurious ? -2.6 : -1}
            r="1.5"
            fill="#FFFDF8"
          />

          {/* Bochecha */}
          <ellipse cx="14.5" cy="7.5" rx="4" ry="2.4" fill="#FF9B85" />

          {/* Expressão da boca: sorriso lateral (Pose 1) ou "o" curioso (Pose 5) */}
          {isCurious ? (
            <circle cx="22.5" cy="6" r="2" fill="#2D3142" />
          ) : (
            <path
              d="M 21 5.5 Q 24.5 7.5 26 4.5"
              stroke="#2D3142"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Antena com ponta Pêssego Coral */}
          <path
            d="M 18 -11 Q 25 -24 33 -20"
            stroke="#2D3142"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <circle cx="34" cy="-20" r="3.8" fill="#FF9B85" />

          {/* Símbolo ? em Cobalto Pastel para a Pose 5 Curiosa */}
          {isCurious && (
            <g transform="translate(46, -24)" className="animate-question-tilt">
              <path
                d="M -4 -8 C -4 -13, 4 -13, 4 -8 C 4 -4, 0 -3, 0 1"
                stroke="#5B8DEF"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="0" cy="6.5" r="2" fill="#5B8DEF" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

