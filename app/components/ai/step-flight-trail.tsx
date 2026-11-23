"use client";

import type { CSSProperties } from "react";
import type { StepProgress } from "./types";

interface StepFlightTrailProps {
  stepProgress: StepProgress;
}

/**
 * Trilha de Voo compacta até a Colmeia / Estrela (Metrônomo de Progresso):
 * - Oculta durante REFINING_GOAL.
 * - Posicionada de forma discreta no canto superior acima da abelha e da pergunta.
 * - A cada step aprovado pelo Jev, o voo avança um nó e acelera o pulso da estrela final.
 */
export function StepFlightTrail({ stepProgress }: StepFlightTrailProps) {
  const { steps, completedSteps, totalSteps } = stepProgress;
  if (totalSteps === 0) return null;

  const remainingSteps = Math.max(0, totalSteps - completedSteps);
  const isCritical = remainingSteps <= 1;
  const ratio =
    totalSteps > 1
      ? Math.min(1, completedSteps / (totalSteps - 1))
      : completedSteps > 0
        ? 1
        : 0;

  // Cadência do metrônomo acelera conforme se aproxima do fim (2.1s -> 0.48s)
  const beatSeconds = Math.max(0.48, 2.1 - ratio * 1.62);
  const starScale = 0.88 + ratio * 0.28;

  const metronomeStyle = {
    "--metronome-dur": `${beatSeconds.toFixed(2)}s`,
  } as CSSProperties;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={totalSteps}
      aria-valuenow={completedSteps}
      aria-label={`Progresso do plano: etapa ${Math.min(completedSteps + 1, totalSteps)} de ${totalSteps}`}
      style={metronomeStyle}
      className="inline-flex items-center gap-1 rounded-full bg-[#F3EFE6]/75 border border-[#2D3142]/8 pl-2.5 pr-1.5 py-1"
    >
      {steps.map((step) => {
        const isCompleted = step.status === "completed";
        const isCurrent = step.status === "current";

        return (
          <div key={step.id} className="inline-flex items-center gap-1">
            {/* Nó da etapa */}
            <div className="group/step relative flex items-center justify-center">
              <span
                tabIndex={step.goal ? 0 : undefined}
                aria-label={step.goal}
                className={`block rounded-full transition-all duration-300 focus:outline-none ${
                  isCompleted
                    ? "size-2.5 bg-[#95E1B0]"
                    : isCurrent
                      ? "size-3 bg-[#5B8DEF] ring-2 ring-[#5B8DEF]/25"
                      : "size-2 bg-[#2D3142]/18"
                }`}
              />

              {step.goal && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2.5 z-40 w-max max-w-[230px] rounded-2xl bg-white/95 backdrop-blur-sm border border-[#2D3142]/10 px-3 py-2 text-center font-sans text-[11px] font-normal leading-relaxed text-[#2D3142]/85 shadow-[0_8px_24px_-8px_rgba(45,49,66,0.14)] opacity-0 translate-y-0.5 transition-all duration-150 group-hover/step:opacity-100 group-hover/step:translate-y-0 group-focus-within/step:opacity-100 group-focus-within/step:translate-y-0"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 size-2 rotate-45 bg-white border-l border-t border-[#2D3142]/10"
                  />
                  {step.goal}
                </span>
              )}
            </div>

            {/* Segmento curto conectando ao próximo nó ou à estrela final */}
            <span
              aria-hidden="true"
              className={`block w-2.5 sm:w-3.5 transition-colors duration-300 ${
                isCompleted
                  ? "h-0.5 rounded-full bg-[#5B8DEF]"
                  : "border-t border-dashed border-[#FF9B85]"
              }`}
            />
          </div>
        );
      })}

      {/* Destino Final: Estrela / Colmeia Solar compacta com metrônomo */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          viewBox="-26 -26 52 52"
          fill="none"
          className="size-5 overflow-visible"
          aria-hidden="true"
        >
          <circle
            cx="0"
            cy="0"
            r={12 + ratio * 4}
            fill={isCritical ? "#FF9B85" : "#FFE07D"}
            opacity={0.28 + ratio * 0.22}
            className="animate-ring-expand"
          />

          <polygon
            points="0,-16 13.8,-8 13.8,8 0,16 -13.8,8 -13.8,-8"
            fill={isCritical ? "#FFE07D" : "#FFF0E5"}
            stroke={isCritical ? "#FF9B85" : "#FFE07D"}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {ratio >= 0.45 && (
            <g className="animate-star-pulse">
              <path
                d="M -17 -13 L -15.8 -15.8 L -13 -17 L -15.8 -18.2 L -17 -21 L -18.2 -18.2 L -21 -17 L -18.2 -15.8 Z"
                fill="#FF9B85"
              />
              <path
                d="M 18 -11 L 19 -13.5 L 21.5 -14.5 L 19 -15.5 L 18 -18 L 17 -15.5 L 14.5 -14.5 L 17 -13.5 Z"
                fill="#5B8DEF"
              />
            </g>
          )}

          {isCritical && (
            <g className="animate-star-pulse">
              <path
                d="M 16 14 L 17.2 11.2 L 20 10 L 17.2 8.8 L 16 6 L 14.8 8.8 L 12 10 L 14.8 11.2 Z"
                fill="#FF9B85"
              />
              <path
                d="M -16 14 L -15 11.8 L -12.8 10.8 L -15 9.8 L -16 7.5 L -17 9.8 L -19.2 10.8 L -17 11.8 Z"
                fill="#FFE07D"
              />
            </g>
          )}

          <g
            transform={`scale(${starScale.toFixed(2)})`}
            className={
              isCritical
                ? "animate-metronome-critical"
                : "animate-metronome-beat"
            }
          >
            <path
              d="M 0 -11 L 2.8 -2.8 L 11 0 L 2.8 2.8 L 0 11 L -2.8 2.8 L -11 0 L -2.8 -2.8 Z"
              fill={isCritical ? "#FF9B85" : "#FFE07D"}
              stroke="#2D3142"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="0" cy="0" r="2.2" fill="#FFFDF8" />
          </g>
        </svg>
      </div>
    </div>
  );
}
