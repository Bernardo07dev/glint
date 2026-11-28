"use client";

import type { ReactNode } from "react";
import { markOnboardingCompletedAction } from "@/app/actions/auth";
import { FirstAccessAnimation, SplashGate } from "@/app/components/animations";

interface FirstAccessGateProps {
  showSplash: boolean;
  headline: string;
  children: ReactNode;
}

export function FirstAccessGate({
  showSplash,
  headline,
  children,
}: FirstAccessGateProps) {
  if (!showSplash) {
    return <>{children}</>;
  }

  return (
    <SplashGate
      durationMs={3400}
      onDismiss={() => {
        void markOnboardingCompletedAction();
      }}
      renderAnimation={(isExiting) => (
        <FirstAccessAnimation headline={headline} isExiting={isExiting} />
      )}
    >
      {children}
    </SplashGate>
  );
}
