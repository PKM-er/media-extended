import "@vidstack/react/player/styles/base.css";

import type { MediaViewType } from "@vidstack/react";
import { MediaPlayer, useMediaState } from "@vidstack/react";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useMediaViewStore } from "./context";
import { useViewTypeDetect } from "./fix-webm-audio";
import { AudioLayout } from "./player/layouts/audio-layout";
import { VideoLayout } from "./player/layouts/video-layout";
import { MediaProviderEnhanced } from "./provider";

function HookLoader({
  onViewTypeChange,
}: {
  onViewTypeChange: (viewType: "audio" | "unknown") => any;
}) {
  useViewTypeDetect(onViewTypeChange);
  return <></>;
}

function PlayerLayout() {
  const actualViewType = useMediaState("viewType");
  if (actualViewType === "audio") return <AudioLayout />;
  return <VideoLayout />;
}

export function Player() {
  const playerRef = useMediaViewStore((s) => s.playerRef);

  const src = useMediaViewStore((s) => s.source?.src);

  const [viewType, setViewType] = useState<MediaViewType>("unknown");
  const title = useMediaViewStore((s) => s.title);

  if (!src) return null;
  return (
    <MediaPlayer
      className={cn(
        "w-full bg-slate-900 text-white font-sans overflow-hidden rounded-md ring-mod-border-focus data-[focus]:ring-2",
        "data-[view-type=video]:aspect-video data-[view-type=audio]:h-20 data-[view-type=audio]:aspect-auto",
      )}
      src={src}
      playsinline
      title={title}
      viewType={viewType}
      ref={playerRef}
    >
      <MediaProviderEnhanced />
      <HookLoader onViewTypeChange={setViewType} />
      <PlayerLayout />
    </MediaPlayer>
  );
}
