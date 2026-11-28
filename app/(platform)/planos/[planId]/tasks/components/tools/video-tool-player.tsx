"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { ChevronDown, CircleCheck, Pause, Play } from "@gravity-ui/icons";
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
  const [showDescription, setShowDescription] = useState(false);

  const seekTo = useCallback(
    (seconds: number, autoPlay = false) => {
      const clamped = Math.min(Math.max(seconds, clipStart), clipEnd);
      const player = playerRef.current;
      if (typeof player?.seekTo === "function") {
        player.seekTo(clamped, true);
      }
      if (autoPlay && typeof player?.playVideo === "function") {
        player.playVideo();
      }
      setCurrent(clamped);
    },
    [clipStart, clipEnd],
  );

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player || typeof player.playVideo !== "function") return;
    if (playing) {
      player.pauseVideo?.();
    } else {
      if (current >= clipEnd - 0.5) {
        player.seekTo?.(clipStart, true);
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
          onReady: () => {
            if (!mounted || interval) return;
            interval = setInterval(() => {
              const fn = playerRef.current?.getCurrentTime;
              if (typeof fn === "function") {
                const t = fn.call(playerRef.current);
                if (typeof t === "number") setCurrent(t);
              }
            }, 400);
          },
          onStateChange: (e) => {
            const state = e.data;
            if (state === 1) setPlaying(true);
            if (state === 2 || state === 0) setPlaying(false);
            const currentTime =
              typeof e.target.getCurrentTime === "function"
                ? e.target.getCurrentTime()
                : 0;
            if (state === 0 || currentTime >= clipEnd) {
              e.target.pauseVideo?.();
              if (!endedRef.current) {
                endedRef.current = true;
                setFinished(true);
                onEnded?.();
              }
            }
          },
        },
      });
    });

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      if (typeof playerRef.current?.destroy === "function") {
        playerRef.current.destroy();
      }
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
    <section className="space-y-5">
      {/* Player principal */}
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[#2D3142]/10 bg-[#1F2330] shadow-xs">
        <div className="aspect-video w-full" ref={containerRef} />
      </div>

      {/* Cabeçalho do vídeo + trecho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="font-display text-base sm:text-lg font-medium leading-snug text-[#2D3142]">
            {video.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#646B82]">
            {video.channel && <span>{video.channel}</span>}
            {video.channel && <span aria-hidden="true">·</span>}
            <span className="tabular-nums">
              Trecho {formatTime(clipStart)}–{formatTime(clipEnd)} ({formatTime(clipDuration)})
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {video.transcriptSummary && (
            <button
              type="button"
              onClick={() => setShowDescription((prev) => !prev)}
              aria-expanded={showDescription}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                showDescription
                  ? "bg-[#E8F0FE] text-[#3E6FD6]"
                  : "bg-[#F3EFE6] text-[#646B82] hover:bg-[#EAE4D7] hover:text-[#2D3142]"
              }`}
            >
              <span>Descrição</span>
              <ChevronDown
                className={`size-3.5 transition-transform duration-200 ${
                  showDescription ? "rotate-180" : ""
                }`}
              />
            </button>
          )}

          {finished ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#95E1B0]/30 px-3 py-1 text-xs font-semibold text-[#1F5134]">
              <CircleCheck className="size-3.5" />
              <span>Trecho assistido</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={togglePlayPause}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F3EFE6] px-3 py-1.5 text-xs font-semibold text-[#2D3142] transition-colors hover:bg-[#E8F0FE] hover:text-[#3E6FD6] cursor-pointer"
            >
              {playing ? (
                <>
                  <Pause className="size-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5" />
                  <span>Assistir trecho</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Descrição expandível */}
      {video.transcriptSummary && showDescription && (
        <p className="rounded-2xl bg-[#FFFDF8] border border-[#2D3142]/8 px-4 py-3 text-sm leading-[1.65] text-[#2D3142]/85">
          {video.transcriptSummary}
        </p>
      )}

      {/* Capítulos / Momentos-chave em lista limpa */}
      {sortedMoments.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-[#646B82]">
            Momentos-chave
          </p>
          <ul className="divide-y divide-[#2D3142]/6 rounded-2xl border border-[#2D3142]/8 bg-[#FFFDF8]">
            {sortedMoments.map((moment, idx) => {
              const isActive = idx === activeMomentIdx;
              return (
                <li key={`${moment.timestampSeconds}-${moment.label}`}>
                  <button
                    type="button"
                    onClick={() => seekTo(moment.timestampSeconds, true)}
                    className={`group flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer first:rounded-t-2xl last:rounded-b-2xl ${
                      isActive
                        ? "bg-[#E8F0FE]/60 text-[#2D3142]"
                        : "text-[#2D3142]/85 hover:bg-[#F3EFE6]/60"
                    }`}
                  >
                    <span
                      className={`w-11 shrink-0 font-mono text-xs font-semibold tabular-nums ${
                        isActive
                          ? "text-[#3E6FD6]"
                          : "text-[#5B8DEF] group-hover:text-[#3E6FD6]"
                      }`}
                    >
                      {formatTime(moment.timestampSeconds)}
                    </span>
                    <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug">
                      {moment.label}
                    </span>
                    {isActive && (
                      <span className="size-1.5 shrink-0 rounded-full bg-[#5B8DEF]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
