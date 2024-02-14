import "@vidstack/react/player/styles/base.css";

import type { MediaViewType } from "@vidstack/react";
import { MediaPlayer, Track, useMediaState } from "@vidstack/react";

import { useState } from "react";
import { useTempFragHandler } from "@/components/hook/use-temporal-frag";
import { encodeWebpageUrl } from "@/lib/remote-player/encode";
import { cn } from "@/lib/utils";
import { useIsEmbed, useMediaViewStore, useSettings } from "./context";
import { useViewTypeDetect } from "./hook/fix-webm-audio";
import { useControls, useDefaultVolume, useHashProps } from "./hook/use-hash";
import { AudioLayout } from "./player/layouts/audio-layout";
import { VideoLayout } from "./player/layouts/video-layout";
import { MediaProviderEnhanced } from "./provider";

function HookLoader({
  onViewTypeChange,
}: {
  onViewTypeChange: (viewType: "audio" | "unknown") => any;
}) {
  useViewTypeDetect(onViewTypeChange);
  useTempFragHandler();
  useDefaultVolume();
  return <></>;
}

function PlayerLayout() {
  const actualViewType = useMediaState("viewType");

  const controls = useControls();
  if (actualViewType === "audio") return <AudioLayout />;
  if (!controls) return null;
  return <VideoLayout />;
}

export function Player() {
  const playerRef = useMediaViewStore((s) => s.playerRef);

  const src = useMediaViewStore(({ source }) => {
    if (!source) return;
    const url = source.url.source.href;
    if (source.enableWebview) {
      // webview will create a new MediaURL instance
      return encodeWebpageUrl(url);
    }
    return url;
  });
  const textTracks = useMediaViewStore(({ textTracks }) => textTracks);
  const load = useSettings((s) => s.loadStrategy);
  const isEmbed = useIsEmbed();

  const [viewType, setViewType] = useState<MediaViewType>("unknown");
  const title = useMediaViewStore((s) => s.title);
  const { controls, ...hashProps } = useHashProps();

  if (!src) return null;
  return (
    <MediaPlayer
      className={cn(
        "w-full bg-slate-900 text-white font-sans overflow-hidden rounded-md ring-mod-border-focus data-[focus]:ring-2",
        "data-[view-type=video]:aspect-video data-[view-type=audio]:h-20 data-[view-type=audio]:aspect-auto",
      )}
      load={isEmbed ? load : "eager"}
      src={src}
      playsInline
      title={title}
      viewType={viewType}
      ref={playerRef}
      {...hashProps}
    >
      <MediaProviderEnhanced>
        {textTracks.map((props) => (
          <Track {...props} key={props.id} />
        ))}
      </MediaProviderEnhanced>
      <HookLoader onViewTypeChange={setViewType} />
      <PlayerLayout />
    </MediaPlayer>
  );
}
