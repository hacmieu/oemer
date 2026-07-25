"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Stop } from "@phosphor-icons/react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import AudioPlayer from "@isamu/osmd-audio-player";
// The package only default-exports the engine, so the enums come from its
// published module rather than the index.
import {
  PlaybackEvent,
  PlaybackState,
} from "@isamu/osmd-audio-player/dist/PlaybackEngine";

import { Button } from "@/components/button";

type Transport = "idle" | "loading" | "playing" | "paused" | "error";

export default function ScoreViewer({ xml }: { xml: string }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<AudioPlayer | null>(null);
  const [transport, setTransport] = useState<Transport>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!host.current) return;
    let live = true;
    let cursorSizing: MutationObserver | undefined;

    // Moving to another score reuses this component, so the previous score's
    // transport state has to be cleared or it shows as still playing.
    setTransport("loading");
    setError(null);

    const osmd = new OpenSheetMusicDisplay(host.current, {
      // Leave this off. Resizing makes OSMD rebuild its cursor, and the audio
      // player keeps a reference to the old one, so playback silently stops
      // moving the cursor. The score scrolls horizontally instead of reflowing.
      autoResize: false,
      drawTitle: true,
      followCursor: true,
      // The cursor is the only moving thing on the page, so it carries the accent.
      cursorsOptions: [{ type: 0, color: "#b45309", alpha: 0.25, follow: true }],
    });

    (async () => {
      try {
        await osmd.load(xml);
        if (!live) return;
        await osmd.render();
        if (!live) return;

        osmd.cursor.reset();
        osmd.cursor.show();
        cursorSizing = keepCursorTallEnough(host.current!);

        const audio = new AudioPlayer();
        await audio.loadScore(osmd);
        if (!live) return;

        audio.on(PlaybackEvent.STATE_CHANGE, () =>
          setTransport(
            audio.state === PlaybackState.PLAYING
              ? "playing"
              : audio.state === PlaybackState.PAUSED
                ? "paused"
                : "idle",
          ),
        );
        player.current = audio;
        setTransport("idle");
      } catch (e) {
        if (!live) return;
        setTransport("error");
        setError(e instanceof Error ? e.message : "Không hiển thị được bản nhạc.");
      }
    })();

    return () => {
      live = false;
      cursorSizing?.disconnect();
      player.current?.stop();
      player.current = null;
      osmd.clear();
    };
  }, [xml]);

  const ready = transport !== "loading" && transport !== "error";

  return (
    <div>
      {/* Following the cursor scrolls the score away, so the transport stays put
          under the header rather than leaving the user unable to pause. */}
      <div className="sticky top-16 z-[1] flex flex-wrap items-center gap-2 rounded-t-panel border-b border-line bg-surface/90 px-5 py-3 backdrop-blur">
        {transport === "playing" ? (
          <Button onClick={() => player.current?.pause()} disabled={!ready}>
            <Pause size={16} weight="fill" aria-hidden />
            Tạm dừng
          </Button>
        ) : (
          <Button onClick={() => player.current?.play()} disabled={!ready}>
            <Play size={16} weight="fill" aria-hidden />
            {transport === "paused" ? "Tiếp tục" : "Phát"}
          </Button>
        )}

        <Button
          variant="secondary"
          onClick={() => player.current?.stop()}
          disabled={!ready || transport === "idle"}
        >
          <Stop size={16} weight="fill" aria-hidden />
          Dừng
        </Button>

        <span aria-live="polite" className="ml-auto text-sm text-ink-muted">
          {transport === "loading" && "Đang dựng bản nhạc"}
          {transport === "playing" && "Đang phát"}
          {transport === "paused" && "Đã tạm dừng"}
        </span>
      </div>

      {error && (
        <p role="alert" className="bg-danger-soft px-5 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="paper overflow-x-auto rounded-b-panel p-5">
        {transport === "loading" && (
          <div className="animate-pulse space-y-6 py-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2.5">
                {[0, 1, 2, 3, 4].map((line) => (
                  <div key={line} className="h-px bg-zinc-200" />
                ))}
              </div>
            ))}
          </div>
        )}
        <div id="osmd-host" ref={host} />
      </div>
    </div>
  );
}

/** OSMD stretches its one-pixel-tall cursor image with a height attribute, but
 *  Tailwind's preflight sets `height: auto` on every image, which collapses it
 *  back to a single pixel. CSS cannot read the attribute, so the value is
 *  mirrored into an inline style.
 *
 *  This watches the whole score rather than the cursor element: autoResize makes
 *  OSMD re-render and build a fresh cursor, which would leave an observer bound
 *  to the old one watching a detached node. */
function keepCursorTallEnough(host: HTMLElement): MutationObserver {
  const sync = () => {
    for (const img of host.querySelectorAll<HTMLImageElement>('img[id^="cursorImg"]')) {
      const height = img.getAttribute("height");
      if (height) img.style.height = `${height}px`;
    }
  };
  // Only `height` is watched, so writing to `style` cannot retrigger this.
  const observer = new MutationObserver(sync);
  observer.observe(host, { subtree: true, childList: true, attributeFilter: ["height"] });
  sync();
  return observer;
}
