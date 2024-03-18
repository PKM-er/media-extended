import "@vidstack/react/player/styles/base.css";

import type { MediaViewType, PlayerSrc } from "@vidstack/react";
import { MediaPlayer, Track, useMediaState } from "@vidstack/react";

import { Notice } from "obsidian";
import { useMemo, useState } from "react";
import { useTempFragHandler } from "@/components/hook/use-temporal-frag";
import { encodeWebpageUrl } from "@/lib/remote-player/encode";
import { cn } from "@/lib/utils";
import { toInfoKey } from "../media-note/note-index";
import { isFileMediaInfo } from "../media-view/media-info";
import { useApp, useIsEmbed, useMediaViewStore, useSettings } from "./context";
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

function useSource() {
  const mediaInfo = useMediaViewStore((s) => s.source?.url);
  const { vault } = useApp();
  const mediaInfoKey = mediaInfo ? toInfoKey(mediaInfo) : null;
  const src = useMemo(() => {
    if (!mediaInfo) return;
    if (isFileMediaInfo(mediaInfo)) {
      return vault.getResourcePath(mediaInfo.file);
    }
    return mediaInfo.source.href;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaInfoKey]);

  const type = useMediaViewStore(
    (s): "video/mp4" | "audio/mp3" | "webpage" | undefined => {
      const viewType = s.source?.viewType;
      if (!viewType) return;
      if (viewType === "mx-webpage") return "webpage";
      if (viewType?.endsWith("video")) return "video/mp4";
      if (viewType?.endsWith("audio")) return "audio/mp3";
    },
  );
  if (!src) return;

  if (type === "webpage") {
    return { src: encodeWebpageUrl(src) } satisfies PlayerSrc;
  }
  return { src, type } satisfies PlayerSrc;
}

export function Player() {
  const playerRef = useMediaViewStore((s) => s.playerRef);

  const source = useSource();
  const isWebm = useMediaViewStore(({ source }) => {
    if (!source) return;
    if (isFileMediaInfo(source.url)) {
      return source.url.file.extension === "webm";
    }
    return source.url.source.pathname.endsWith(".webm");
  });
  const textTracks = useMediaViewStore(({ textTracks }) => textTracks);
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
      onError={(e) => {
        new Notice(
          createFragment((frag) => {
            frag.appendText(`Failed to load media for ${source.src}: `);
            frag.createEl("br");
            switch (e.code) {
              // MEDIA_ERR_ABORTED
              case 1:
                frag.appendText("The media playback was aborted");
                break;
              // MEDIA_ERR_NETWORK
              case 2:
                frag.appendText(
                  "A network error caused the media playback to fail",
                );
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
                console.error("Failed to load media", source.src, e);
                break;
            }
          }),
        );
      }}
      {...hashProps}
    >
      <MediaProviderEnhanced>
        {textTracks.map((props) => (
          <Track {...props} key={props.id} />
        ))}
      </MediaProviderEnhanced>
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
