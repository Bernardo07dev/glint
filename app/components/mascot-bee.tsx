"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

interface MascotBeeProps {
  pose?: "standard" | "curious";
  glasses?: boolean;
  lookAtUser?: boolean;
  dynamic?: boolean;
  reactionTrigger?: number;
  className?: string;
}

/**
 * Mascote Abelhinha de Perfil (ANIMATIONS.md):
 * - standard (Pose 1): saudação e estados neutros
 * - curious (Pose 5): entrevista inicial e convite de novos alunos (?)
 * - glasses: óculos redondos para foco / investigação
 * - lookAtUser: corpo de perfil com o rosto em 3/4 olhando para o usuário
 */
export function MascotBee({
  pose = "standard",
  glasses = false,
  lookAtUser = false,
  dynamic = false,
  reactionTrigger = 0,
  className = "h-20 w-24",
}: MascotBeeProps) {
  const [dynamicPose, setDynamicPose] = useState<"standard" | "curious">(pose);
  const [motion, setMotion] = useState({ x: 0, y: 0, rotate: 0 });
  const [isReacting, setIsReacting] = useState(false);
  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerReaction = () => {
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current);
    }
    setIsReacting(true);
    setDynamicPose((prev) => (prev === "curious" ? "standard" : "curious"));
    reactionTimeoutRef.current = setTimeout(() => {
      setIsReacting(false);
    }, 650);
  };

  const handleKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerReaction();
    }
  };

  useEffect(() => {
    if (reactionTrigger > 0) {
      triggerReaction();
    }
  }, [reactionTrigger]);

  useEffect(() => {
    return () => {
      if (reactionTimeoutRef.current) {
        clearTimeout(reactionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!dynamic) {
      setDynamicPose(pose);
      setMotion({ x: 0, y: 0, rotate: 0 });
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const delay = 1200 + Math.random() * 1100;
      timeoutId = setTimeout(() => {
        setDynamicPose((prev) =>
          Math.random() > 0.35 ? (prev === "curious" ? "standard" : "curious") : prev,
        );
        setMotion({
          x: Math.round((Math.random() - 0.5) * 10),
          y: Math.round((Math.random() - 0.5) * 10),
          rotate: Math.round((Math.random() - 0.5) * 20),
        });
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [dynamic, pose]);

  const isCurious = (dynamic ? dynamicPose : pose) === "curious";
  const baseX = (isCurious ? 58 : 60) + motion.x;
  const baseY = 56 + motion.y;
  const baseRotate = (isCurious ? 4 : 0) + motion.rotate;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 132 104"
      fill="none"
      role="button"
      tabIndex={0}
      aria-label="Interagir com a abelhinha"
      onClick={triggerReaction}
      onKeyDown={handleKeyDown}
      className={`${className} cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] rounded-full`}
    >
      <g
        transform={
          isReacting
            ? `translate(${baseX}, ${baseY - 7}) rotate(${baseRotate - 18}) scale(1.14)`
            : `translate(${baseX}, ${baseY}) rotate(${baseRotate})`
        }
        className={
          isReacting
            ? "transition-transform duration-300 ease-out"
            : dynamic
              ? "transition-transform duration-700 ease-in-out"
              : "transition-transform duration-300 ease-out"
        }
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

          {isReacting && (
            <g fill="#5B8DEF" className="animate-star-pulse">
              <path d="M 36 -18 L 38 -23 L 43 -25 L 38 -27 L 36 -32 L 34 -27 L 29 -25 L 34 -23 Z" />
              <path d="M -32 -24 L -30.5 -28 L -26.5 -29.5 L -30.5 -31 L -32 -35 L -33.5 -31 L -37.5 -29.5 L -33.5 -28 Z" />
              <path d="M 38 14 L 39.5 10.5 L 43 9 L 39.5 7.5 L 38 4 L 36.5 7.5 L 33 9 L 36.5 10.5 Z" />
            </g>
          )}

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

          {lookAtUser ? (
            <>
              {/* Rosto em 3/4: corpo de perfil, olhar voltado para o usuário */}
              <g className="animate-bee-blink">
                <circle cx="10.5" cy="0" r="3.6" fill="#2D3142" />
                <circle cx="11.6" cy="-1.3" r="1.3" fill="#FFFDF8" />
                <ellipse cx="21" cy="-0.3" rx="2.8" ry="3.4" fill="#2D3142" />
                <circle cx="21.8" cy="-1.5" r="1.1" fill="#FFFDF8" />
              </g>

              {glasses && (
                <g stroke="#FF9B85" strokeLinecap="round">
                  {/* Haste lateral indo para trás */}
                  <line x1="5" y1="-1" x2="-2" y2="-2.5" strokeWidth="2.2" />
                  {/* Lente próxima */}
                  <circle
                    cx="10.5"
                    cy="0"
                    r="5.5"
                    fill="#FFFDF8"
                    fillOpacity="0.35"
                    strokeWidth="2.2"
                  />
                  {/* Ponte */}
                  <path d="M 15.6 -1.6 Q 16.4 -3 17.2 -1.6" strokeWidth="1.8" fill="none" />
                  {/* Lente distante (em perspectiva) */}
                  <ellipse
                    cx="21"
                    cy="-0.3"
                    rx="4.2"
                    ry="5.2"
                    fill="#FFFDF8"
                    fillOpacity="0.35"
                    strokeWidth="2.2"
                  />
                  {/* Reflexo na lente */}
                  <path
                    d="M 7.5 -3.2 Q 9 -4.6 11 -4.2"
                    stroke="#FFFDF8"
                    strokeWidth="1.3"
                    opacity="0.9"
                    fill="none"
                  />
                </g>
              )}

              {/* Bochechas */}
              <ellipse cx="7.5" cy="7" rx="3" ry="1.8" fill="#FF9B85" />
              <ellipse cx="23.5" cy="6.6" rx="1.9" ry="1.5" fill="#FF9B85" />

              {/* Boca centralizada no rosto */}
              {isCurious ? (
                <circle cx="15.8" cy="8.2" r="1.8" fill="#2D3142" />
              ) : (
                <path
                  d="M 13 7.5 Q 15.8 10.2 18.6 7.5"
                  stroke="#2D3142"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              )}
            </>
          ) : (
            <>
              {/* Olho de perfil com piscada natural */}
              <g className="animate-bee-blink">
                <circle
                  cx="16.5"
                  cy={isCurious ? -0.5 : 0.5}
                  r="4.2"
                  fill="#2D3142"
                />
                <circle
                  cx="18.2"
                  cy={isCurious ? -1.8 : -1}
                  r="1.6"
                  fill="#FFFDF8"
                />
              </g>

              {/* Óculos redondos de perfil */}
              {glasses && (
                <g>
                  <line
                    x1="1"
                    y1="-1"
                    x2="9"
                    y2="-1"
                    stroke="#FF9B85"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="16.5"
                    cy={isCurious ? -0.8 : 0.5}
                    r="7.5"
                    fill="#FFFDF8"
                    fillOpacity="0.4"
                    stroke="#FF9B85"
                    strokeWidth="2.4"
                  />
                  <path
                    d="M 12.5 -4.5 Q 14.5 -6 17 -5"
                    stroke="#FFFDF8"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </g>
              )}

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
            </>
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

