"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { CircleCheck, Pause, Play, Scissors } from "@gravity-ui/icons";
import type { VideoToolData } from "./types";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          host?: string;
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { target: YTPlayer; data: number }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState?: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    });
  }
  return ytApiPromise;
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${rest.toString().padStart(2, "0")}`;
}

export function VideoToolPlayer({
  video,
  onEnded,
}: {
  video: VideoToolData;
  onEnded?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const endedRef = useRef(false);

  const clipStart = video.watchStartSeconds ?? 0;
  const clipEnd = video.watchEndSeconds ?? video.durationSeconds ?? 0;
  const clipDuration = Math.max(1, clipEnd - clipStart);

  const [current, setCurrent] = useState(clipStart);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);

  const seekTo = useCallback(
    (seconds: number, autoPlay = false) => {
      const clamped = Math.min(Math.max(seconds, clipStart), clipEnd);
      playerRef.current?.seekTo(clamped, true);
      if (autoPlay) {
        playerRef.current?.playVideo();
      }
      setCurrent(clamped);
    },
    [clipStart, clipEnd],
  );

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) {
      player.pauseVideo();
    } else {
      if (current >= clipEnd - 0.5) {
        player.seekTo(clipStart, true);
        setCurrent(clipStart);
      }
      player.playVideo();
    }
  }, [playing, current, clipEnd, clipStart]);

  useEffect(() => {
    endedRef.current = false;
    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    loadYouTubeApi().then(() => {
      if (!mounted || !containerRef.current || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        host: "https://www.youtube-nocookie.com",
        videoId: video.videoId,
        playerVars: {
          start: Math.floor(clipStart),
          end: Math.ceil(clipEnd),
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onStateChange: (e) => {
            const state = e.data;
            if (state === 1) setPlaying(true);
            if (state === 2 || state === 0) setPlaying(false);
            if (state === 0 || e.target.getCurrentTime() >= clipEnd) {
              e.target.pauseVideo();
              if (!endedRef.current) {
                endedRef.current = true;
                setFinished(true);
                onEnded?.();
              }
            }
          },
        },
      });

      interval = setInterval(() => {
        const t = playerRef.current?.getCurrentTime();
        if (typeof t === "number") setCurrent(t);
      }, 400);
    });

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.videoId]);

  const progress = Math.min(1, Math.max(0, (current - clipStart) / clipDuration));

  const onTimelineClick = (e: ReactMouseEvent) => {
    const el = timelineRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekTo(clipStart + ratio * clipDuration, true);
  };

  const sortedMoments = [...(video.keyMoments ?? [])].sort(
    (a, b) => a.timestampSeconds - b.timestampSeconds,
  );

  let activeMomentIdx = -1;
  for (let i = 0; i < sortedMoments.length; i++) {
    if (current + 0.5 >= sortedMoments[i].timestampSeconds) {
      activeMomentIdx = i;
    }
  }

  return (
    <section className="space-y-4">
      {/* Moldura principal do Player + Controles do Recorte */}
      <div className="overflow-hidden rounded-2xl border border-[#2D3142]/10 bg-[#FFFDF8]">
        {/* Barra superior de contexto do vídeo */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2D3142]/8 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#2D3142]">
              {video.title}
            </p>
            {video.channel && (
              <p className="truncate text-xs text-[#646B82]">{video.channel}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE07D]/45 px-2.5 py-1 text-xs font-medium tabular-nums text-[#2D3142]">
              <Scissors className="size-3.5 text-[#2D3142]/75" />
              <span>
                Recorte {formatTime(clipStart)}–{formatTime(clipEnd)}
              </span>
            </span>

            {finished && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#95E1B0]/30 px-2.5 py-1 text-xs font-semibold text-[#2B6E47]">
                <CircleCheck className="size-3.5" />
                <span>Trecho concluído</span>
              </span>
            )}
          </div>
        </div>

        {/* Área 16:9 do vídeo */}
        <div className="bg-[#1F2330]">
          <div className="aspect-video w-full" ref={containerRef} />
        </div>

        {/* Barra de controle dedicada ao recorte */}
        <div className="flex items-center gap-3.5 border-t border-[#2D3142]/8 bg-white px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={playing ? "Pausar trecho" : "Reproduzir trecho"}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#5B8DEF] text-white transition-colors hover:bg-[#4a7de0] cursor-pointer"
          >
            {playing ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </button>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div
              ref={timelineRef}
              role="slider"
              tabIndex={0}
              aria-label="Linha do tempo do trecho selecionado"
              aria-valuemin={0}
              aria-valuemax={clipDuration}
              aria-valuenow={Math.round(current - clipStart)}
              onClick={onTimelineClick}
              className="group relative h-2.5 cursor-pointer rounded-full bg-[#F3EFE6]"
            >
              <div
                className="absolute inset-y-0 left-0 right-0 origin-left rounded-full bg-[#5B8DEF] transition-transform duration-200 ease-out"
                style={{ transform: `scaleX(${progress})` }}
              />

              {sortedMoments.map((moment) => {
                const pos = Math.min(
                  1,
                  Math.max(0, (moment.timestampSeconds - clipStart) / clipDuration),
                );
                return (
                  <span
                    key={moment.timestampSeconds}
                    title={`${formatTime(moment.timestampSeconds)} · ${moment.label}`}
                    className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#FF9B85]"
                    style={{ left: `${pos * 100}%` }}
                  />
                );
              })}

              <span
                aria-hidden="true"
                className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#5B8DEF] bg-white shadow-xs transition-transform group-hover:scale-110"
                style={{ left: `${progress * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-medium tabular-nums text-[#646B82]">
              <span>
                {formatTime(current - clipStart)} / {formatTime(clipDuration)}
                {playing && (
                  <span className="text-[#3E6FD6]"> · em reprodução</span>
                )}
              </span>
              <span>Duração do recorte: {Math.max(1, Math.round(clipDuration / 60))} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Capítulos / Momentos-chave clicáveis */}
      {sortedMoments.length > 0 && (
        <div className="space-y-2">
          <p className="px-0.5 text-xs font-semibold text-[#646B82]">
            Momentos-chave neste trecho
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {sortedMoments.map((moment, idx) => {
              const isActive = idx === activeMomentIdx;
              return (
                <button
                  key={`${moment.timestampSeconds}-${moment.label}`}
                  type="button"
                  onClick={() => seekTo(moment.timestampSeconds, true)}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                    isActive
                      ? "border-[#5B8DEF]/40 bg-[#E8F0FE]/60"
                      : "border-[#2D3142]/8 bg-[#FFFDF8] hover:border-[#5B8DEF]/30 hover:bg-[#E8F0FE]/30"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                      isActive
                        ? "bg-[#5B8DEF] text-white"
                        : "bg-[#F3EFE6] text-[#3E6FD6]"
                    }`}
                  >
                    <Play className="size-2.5" />
                    <span>{formatTime(moment.timestampSeconds)}</span>
                  </span>
                  <span className="text-xs font-medium leading-snug text-[#2D3142]">
                    {moment.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumo do trecho */}
      {video.transcriptSummary && (
        <div className="rounded-2xl border border-[#2D3142]/8 bg-[#F3EFE6]/50 px-4 py-3.5">
          <p className="text-xs font-semibold text-[#2D3142]">
            O que observar no vídeo
          </p>
          <p className="mt-1 max-w-[70ch] text-[13px] leading-[1.6] text-[#2D3142]/80">
            {video.transcriptSummary}
          </p>
        </div>
      )}
    </section>
  );
}
