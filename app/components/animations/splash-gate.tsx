"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

interface SplashGateProps {
  durationMs?: number;
  storageKey?: string;
  allowSkip?: boolean;
  onDismiss?: () => void;
  renderAnimation: (isExiting: boolean) => ReactNode;
  children: ReactNode;
}

/**
 * Wrapper de abertura para cenas Splash (FIRST_ACCESS, HOME_SPLASH, PLANS_HUB):
 * - Controla exibição única por sessão via `sessionStorage` (quando `storageKey` é informada)
 * - Dispara Curtain Reveal (`isExiting = true`) após `durationMs` ou ao clicar/pressionar Escape
 * - Mantém o conteúdo filho montado por baixo para transição instantânea sem piscar
 */
export function SplashGate({
  durationMs = 2400,
  storageKey,
  allowSkip = true,
  onDismiss,
  renderAnimation,
  children,
}: SplashGateProps) {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === "undefined" || !storageKey) return true;
    try {
      return window.sessionStorage.getItem(storageKey) !== "1";
    } catch {
      return true;
    }
  });
  const [isExiting, setIsExiting] = useState(false);

  const dismiss = useCallback(() => {
    if (isExiting || !visible) return;
    setIsExiting(true);

    if (storageKey && typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // Ignora falhas de quota em navegação privada
      }
    }

    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 520);
  }, [isExiting, visible, storageKey, onDismiss]);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(dismiss, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, dismiss]);

  useEffect(() => {
    if (!visible || !allowSkip) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        dismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, allowSkip, dismiss]);

  return (
    <>
      {children}
      {visible && (
        <div
          className="fixed inset-0 z-50"
          onClick={allowSkip ? dismiss : undefined}
        >
          {renderAnimation(isExiting)}
        </div>
      )}
    </>
  );
}
