"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "@gravity-ui/icons";
import {
  DYNAMIC_SCENE_PRESETS,
  FullscreenDynamicAnimation,
  type DynamicAnimationSceneId,
} from "@/app/components/animations";

const SCENE_ORDER: DynamicAnimationSceneId[] = [
  "WAITING_FRONT_TAP",
  "FIRST_ACCESS",
  "HOME_SPLASH_READY",
  "HOME_SPLASH_STREAK",
  "HOME_SPLASH_RETURN",
  "HOME_SPLASH_REST",
  "PLAN_CREATION",
  "PLANS_HUB",
];

export function AnimationsShowcaseClient() {
  const [activeScene, setActiveScene] =
    useState<DynamicAnimationSceneId>("WAITING_FRONT_TAP");
  const [replayKey, setReplayKey] = useState(0);
  const [hudVisible, setHudVisible] = useState(true);

  const handleSelectScene = (sceneId: DynamicAnimationSceneId) => {
    setActiveScene(sceneId);
    setReplayKey((k) => k + 1);
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#FFFDF8]">
      {/* Palco Full-Screen Principal (100vw x 100dvh) */}
      <FullscreenDynamicAnimation
        key={`${activeScene}-${replayKey}`}
        sceneId={activeScene}
        headline={DYNAMIC_SCENE_PRESETS[activeScene].headline}
        backHref="/home"
      />

      {/* Quando em Tela Limpa, botão discreto embaixo para reexibir as animações */}
      {!hudVisible && (
        <div className="fixed bottom-5 right-5 z-50">
          <button
            type="button"
            onClick={() => setHudVisible(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#2D3142] px-4 py-2.5 text-xs font-semibold text-[#FFFDF8] transition-transform hover:scale-105"
          >
            <Eye className="size-4" />
            <span>Mostrar animações</span>
          </button>
        </div>
      )}

      {/* Dock Inferior Único: Seletor de Animações + Botão de Tela Limpa */}
      {hudVisible && (
        <nav
          aria-label="Catálogo de cenas Full-Screen"
          className="fixed bottom-4 inset-x-4 z-40 mx-auto max-w-6xl rounded-2xl bg-[#FFFDF8]/92 p-2.5 backdrop-blur-md border border-[#F3EFE6]"
        >
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:pb-0">
            {SCENE_ORDER.map((sceneId) => {
              const preset = DYNAMIC_SCENE_PRESETS[sceneId];
              const isSelected = sceneId === activeScene;

              return (
                <button
                  key={sceneId}
                  type="button"
                  onClick={() => handleSelectScene(sceneId)}
                  className={`group flex shrink-0 flex-col items-start rounded-xl px-3.5 py-2 text-left transition-all ${
                    isSelected
                      ? "bg-[#2D3142] text-[#FFFDF8]"
                      : "bg-[#F3EFE6]/75 text-[#2D3142] hover:bg-[#E8F0FE]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: preset.ribbonPrimary }}
                    />
                    <span className="text-[11px] font-semibold tracking-tight">
                      {preset.sectionLabel}
                    </span>
                  </div>
                  <span
                    className={`mt-0.5 text-xs font-medium ${
                      isSelected ? "text-[#FFE07D]" : "text-[#646B82]"
                    }`}
                  >
                    {preset.variantLabel}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setHudVisible(false)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#2D3142] px-3.5 py-2.5 text-xs font-semibold text-[#FFFDF8] transition-opacity hover:opacity-90"
              title="Ocultar barra para ver a tela 100% limpa"
            >
              <EyeSlash className="size-3.5" />
              <span>Tela Limpa</span>
            </button>
          </div>
        </nav>
      )}
    </main>
  );
}
