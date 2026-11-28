"use client";

import { FirstAccessAnimation } from "./scenes/first-access";
import { HomeSplashAnimation } from "./scenes/home-splash";
import { PlanCreationAnimation } from "./scenes/plan-creation";
import { PlansHubAnimation } from "./scenes/plans-hub";
import { WaitingFrontTapAnimation } from "./scenes/waiting-front-tap";
import {
  DYNAMIC_SCENE_PRESETS,
  type DynamicAnimationSceneId,
} from "./types";

interface FullscreenDynamicAnimationProps {
  sceneId: DynamicAnimationSceneId;
  headline?: string;
  userName?: string;
  customHeadline?: string;
  onBack?: () => void;
  backHref?: string;
  backLabel?: string;
  loopFlight?: boolean;
  isExiting?: boolean;
  onComplete?: () => void;
  className?: string;
}

/**
 * Dispatcher compatível para todas as cenas Full-Screen (usado no showcase /animations).
 * Para uso em produção nas rotas, prefira importar o componente específico da cena diretamente.
 */
export function FullscreenDynamicAnimation({
  sceneId,
  headline,
  userName = "Bernardo",
  customHeadline,
  onBack,
  backHref,
  backLabel,
  loopFlight = true,
  isExiting = false,
  onComplete,
  className = "",
}: FullscreenDynamicAnimationProps) {
  const preset = DYNAMIC_SCENE_PRESETS[sceneId];
  const resolvedHeadline = customHeadline ?? headline ?? preset.headline;

  switch (sceneId) {
    case "WAITING_FRONT_TAP":
      return (
        <WaitingFrontTapAnimation
          headline={resolvedHeadline}
          onBack={onBack}
          backHref={backHref}
          backLabel={backLabel}
          isExiting={isExiting}
          className={className}
        />
      );
    case "FIRST_ACCESS":
      return (
        <FirstAccessAnimation
          headline={customHeadline ?? headline}
          userName={userName}
          isExiting={isExiting}
          className={className}
        />
      );
    case "HOME_SPLASH_READY":
      return (
        <HomeSplashAnimation
          variant="READY"
          headline={resolvedHeadline}
          loopFlight={loopFlight}
          isExiting={isExiting}
          onComplete={onComplete}
          className={className}
        />
      );
    case "HOME_SPLASH_STREAK":
      return (
        <HomeSplashAnimation
          variant="STREAK"
          headline={resolvedHeadline}
          loopFlight={loopFlight}
          isExiting={isExiting}
          onComplete={onComplete}
          className={className}
        />
      );
    case "HOME_SPLASH_RETURN":
      return (
        <HomeSplashAnimation
          variant="RETURN"
          headline={resolvedHeadline}
          loopFlight={loopFlight}
          isExiting={isExiting}
          onComplete={onComplete}
          className={className}
        />
      );
    case "HOME_SPLASH_REST":
      return (
        <HomeSplashAnimation
          variant="REST"
          headline={resolvedHeadline}
          loopFlight={loopFlight}
          isExiting={isExiting}
          onComplete={onComplete}
          className={className}
        />
      );
    case "PLAN_CREATION":
      return (
        <PlanCreationAnimation
          headline={resolvedHeadline}
          loopFlight={loopFlight}
          isExiting={isExiting}
          onComplete={onComplete}
          className={className}
        />
      );
    case "PLANS_HUB":
      return (
        <PlansHubAnimation
          headline={resolvedHeadline}
          loopFlight={loopFlight}
          isExiting={isExiting}
          onComplete={onComplete}
          className={className}
        />
      );
  }
}
