"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { CircleCheck, Pause, Play } from "@gravity-ui/icons";
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
      <div className="overflow-hidden rounded-2xl border border-[#2D3142]/8 bg-[#1F2330]">
        <div className="aspect-video w-full" ref={containerRef} />
      </div>

      {/* Controle leve do trecho */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlayPause}
          aria-label={playing ? "Pausar trecho" : "Reproduzir trecho"}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F3EFE6] text-[#2D3142] transition-colors hover:bg-[#E8F0FE] hover:text-[#3E6FD6] cursor-pointer"
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
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
            className="relative h-1.5 cursor-pointer rounded-full bg-[#F3EFE6]"
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
                  className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-[#FF9B85]"
                  style={{ left: `${pos * 100}%` }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] tabular-nums text-[#646B82]">
            <span>
              {formatTime(current - clipStart)} / {formatTime(clipDuration)}
              {playing && <span className="text-[#3E6FD6]"> · assistindo</span>}
            </span>
            <span>
              Trecho {formatTime(clipStart)}–{formatTime(clipEnd)}
            </span>
          </div>
        </div>
      </div>

      {/* Momentos-chave em pílulas leves */}
      {sortedMoments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sortedMoments.map((moment, idx) => {
            const isActive = idx === activeMomentIdx;
            return (
              <button
                key={`${moment.timestampSeconds}-${moment.label}`}
                type="button"
                onClick={() => seekTo(moment.timestampSeconds, true)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#E8F0FE] text-[#2D3142]"
                    : "bg-[#F3EFE6]/80 text-[#2D3142]/85 hover:bg-[#E8F0FE]"
                }`}
              >
                <span className="tabular-nums font-semibold text-[#3E6FD6]">
                  {formatTime(moment.timestampSeconds)}
                </span>
                <span>{moment.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Resumo e créditos sem caixa extra */}
      <div className="flex items-start justify-between gap-4 pt-1">
        <div className="min-w-0 space-y-1">
          {video.transcriptSummary && (
            <p className="max-w-[68ch] text-[13px] leading-[1.6] text-[#2D3142]/85">
              {video.transcriptSummary}
            </p>
          )}
          <p className="text-xs text-[#646B82]">
            {video.title}
            {video.channel && <span> · {video.channel}</span>}
          </p>
        </div>

        {finished && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#2B6E47]">
            <CircleCheck className="size-4" />
            <span>Trecho assistido</span>
          </span>
        )}
      </div>
    </section>
  );
}
