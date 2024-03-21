import "@vidstack/react/player/styles/base.css";

import type { MediaErrorDetail, MediaViewType } from "@vidstack/react";
import { MediaPlayer, useMediaState } from "@vidstack/react";

import { Notice } from "obsidian";
import { useState } from "react";
import { useTempFragHandler } from "@/components/hook/use-temporal-frag";
import { cn } from "@/lib/utils";
import { isFileMediaInfo } from "../info/media-info";
import { useIsEmbed, useMediaViewStore, useSettings } from "./context";
import { useViewTypeDetect } from "./hook/fix-webm-audio";
import { useControls, useDefaultVolume, useHashProps } from "./hook/use-hash";
import { useAutoContinuePlay } from "./hook/use-playlist";
import { AudioLayout } from "./player/layouts/audio-layout";
import { VideoLayout } from "./player/layouts/video-layout";
import { MediaProviderEnhanced } from "./provider";
import { useSource } from "./use-source";
import { useRemoteTracks } from "./use-tracks";

function HookLoader({
  onViewTypeChange,
}: {
  onViewTypeChange: (viewType: "audio" | "unknown") => any;
}) {
  useViewTypeDetect(onViewTypeChange);
  useRemoteTracks();
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
  const { onEnded } = useAutoContinuePlay();
  const source = useSource();
  const isWebm = useMediaViewStore(({ source }) => {
    if (!source) return;
    if (isFileMediaInfo(source.url)) {
      return source.url.file.extension === "webm";
    }
    return source.url.source.pathname.endsWith(".webm");
  });
  const load = useSettings((s) => s.loadStrategy);
  const isEmbed = useIsEmbed();

  const [viewType, setViewType] = useState<MediaViewType>("unknown");
  const title = useMediaViewStore((s) => s.title);
  const { controls, ...hashProps } = useHashProps();

  if (!source) return null;
  return (
    <MediaPlayer
      className={cn(
        "w-full bg-slate-900 text-white font-sans overflow-hidden rounded-md ring-mod-border-focus data-[focus]:ring-2",
        "data-[view-type=video]:aspect-video data-[view-type=audio]:h-20 data-[view-type=audio]:aspect-auto",
      )}
      load={isEmbed ? load : "eager"}
      src={source}
      playsInline
      title={title}
      viewType={viewType}
      ref={playerRef}
      onEnded={onEnded}
      onError={(e) => handleError(e, source.src)}
      {...hashProps}
    >
      <MediaProviderEnhanced></MediaProviderEnhanced>
      <HookLoader
        onViewTypeChange={(viewType) => {
          setViewType(viewType);
          if (!isWebm && viewType === "audio") {
            new Notice(
              "Unable to show video content due to a potentially unsupported codec by Obsidian. For verification, please disable this plugin, add the video to the vault, and check if video playback resumes normally.",
            );
          }
        }}
      />
      <PlayerLayout />
    </MediaPlayer>
  );
}

function handleError(e: MediaErrorDetail, source: URL | string) {
  new Notice(
    createFragment((frag) => {
      frag.appendText(`Failed to load media for ${source}: `);
      frag.createEl("br");
      switch (e.code) {
        // MEDIA_ERR_ABORTED
        case 1:
          frag.appendText("The media playback was aborted");
          break;
        // MEDIA_ERR_NETWORK
        case 2:
          frag.appendText("A network error caused the media playback to fail");
          break;
        // MEDIA_ERR_DECODE
        case 3:
          frag.appendText(
            "The media playback was aborted due to a corruption problem or because the media encoding is not supported",
          );
          break;
        // MEDIA_ERR_SRC_NOT_SUPPORTED
        case 4:
          frag.appendText(
            "The media is not supported to open as regular video or audio, try open as webpage",
          );
          break;
        default:
          frag.appendText(
            e.message || "Unknown error, check console for more details",
          );
          console.error("Failed to load media", source, e);
          break;
      }
    }),
  );
}
