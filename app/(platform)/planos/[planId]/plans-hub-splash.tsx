"use client";

import type { ReactNode } from "react";
import { PlansHubAnimation, SplashGate } from "@/app/components/animations";

interface PlansHubSplashProps {
  showSplash: boolean;
  headline: string;
  children: ReactNode;
}

export function PlansHubSplash({
  showSplash,
  headline,
  children,
}: PlansHubSplashProps) {
  if (!showSplash) {
    return <>{children}</>;
  }

  return (
    <SplashGate
      durationMs={2600}
      renderAnimation={(isExiting) => (
        <PlansHubAnimation headline={headline} isExiting={isExiting} />
      )}
    >
      {children}
    </SplashGate>
  );
}
