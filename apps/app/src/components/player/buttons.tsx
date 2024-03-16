import "./buttons.global.css";

import {
  CaptionButton,
  FullscreenButton,
  isTrackCaptionKind,
  MuteButton,
  PIPButton,
  PlayButton,
  SeekButton,
  useMediaPlayer,
  useMediaProvider,
  useMediaState,
} from "@vidstack/react";
import { useEffect, useState } from "react";
import {
  PlayIcon,
  PauseIcon,
  MuteIcon,
  VolumeLowIcon,
  VolumeHighIcon,
  SubtitlesIcon,
  PictureInPictureExitIcon,
  PictureInPictureIcon,
  FullscreenExitIcon,
  FullscreenIcon,
  FastForwardIcon,
  RewindIcon,
  EditIcon,
  ImageDownIcon,
  PinIcon,
  NextIcon,
  PreviousIcon,
} from "@/components/icon";
import { cn } from "@/lib/utils";
import { findWithMedia, isWithMedia } from "@/media-note/note-index/playlist";
import {
  useIsEmbed,
  usePlaylistChange,
  useScreenshot,
  useSettings,
  useTimestamp,
} from "../context";
import { usePlaylist } from "../hook/use-playlist";
import { canProviderScreenshot, takeScreenshot } from "./screenshot";

export const buttonClass =
  "group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden";

export function Play() {
  const isPaused = useMediaState("paused");
  return (
    <PlayButton
      className={buttonClass}
      aria-label={isPaused ? "Play" : "Pause"}
    >
      {isPaused ? (
        <PlayIcon className="w-7 h-7 translate-x-px" />
      ) : (
        <PauseIcon className="w-7 h-7" />
      )}
    </PlayButton>
  );
}

export function FastForward({ seconds }: { seconds: number }) {
  return (
    <SeekButton
      className={buttonClass}
      seconds={seconds}
      aria-label={`Fast forward ${seconds}s`}
    >
      <FastForwardIcon className="w-7 h-7" />
    </SeekButton>
  );
}
export function Rewind({ seconds }: { seconds: number }) {
  return (
    <SeekButton
      className={buttonClass}
      seconds={-seconds}
      aria-label={`Rewind ${seconds}s`}
    >
      <RewindIcon className="w-7 h-7" />
    </SeekButton>
  );
}

export function Mute() {
  const volume = useMediaState("volume"),
    isMuted = useMediaState("muted");
  return (
    <MuteButton
      className={buttonClass}
      aria-label={isMuted ? "Unmute" : "Mute"}
    >
      {isMuted || volume == 0 ? (
        <MuteIcon className="w-7 h-7" />
      ) : volume < 0.5 ? (
        <VolumeLowIcon className="w-7 h-7" />
      ) : (
        <VolumeHighIcon className="w-7 h-7" />
      )}
    </MuteButton>
  );
}

export function Caption() {
  const track = useMediaState("textTrack"),
    isOn = track && isTrackCaptionKind(track);
  return (
    <CaptionButton
      className={buttonClass}
      aria-label={isOn ? "Closed-Captions off" : "Closed-Captions on"}
    >
      <SubtitlesIcon className={`w-7 h-7 ${!isOn ? "text-white/60" : ""}`} />
    </CaptionButton>
  );
}

export function PIP() {
  const isActive = useMediaState("pictureInPicture");
  const can = useMediaState("canPictureInPicture");
  if (!can) return null;
  return (
    <PIPButton
      className={buttonClass}
      aria-label={isActive ? "Exit PIP" : "Enter PIP"}
    >
      {isActive ? (
        <PictureInPictureExitIcon className="w-7 h-7" />
      ) : (
        <PictureInPictureIcon className="w-7 h-7" />
      )}
    </PIPButton>
  );
}

export function Fullscreen() {
  const isActive = useMediaState("fullscreen");
  return (
    <FullscreenButton
      className={buttonClass}
      aria-label={isActive ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isActive ? (
        <FullscreenExitIcon className="w-7 h-7" />
      ) : (
        <FullscreenIcon className="w-7 h-7" />
      )}
    </FullscreenButton>
  );
}

export function EditorEdit() {
  const isEmbed = useIsEmbed();
  if (!isEmbed) return null;
  return (
    // let live preview editor handle this
    <button
      className={cn(
        "mx-lp-edit",
        "group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden",
      )}
      onClick={() => void 0}
      {...{ [dataLpPassthrough]: true }}
      aria-label="Edit in editor"
    >
      <EditIcon className="w-7 h-7" />
    </button>
  );
}

export function useScreenshotHanlder() {
  const provider = useMediaProvider();
  const [canScreenshot, updateCanScreenshot] = useState<boolean>(() =>
    canProviderScreenshot(provider),
  );
  const onScreenshot = useScreenshot();
  const type = useSettings((s) => s.screenshotFormat),
    quality = useSettings((s) => s.screenshotQuality);
  useEffect(() => {
    updateCanScreenshot(canProviderScreenshot(provider));
  }, [provider]);
  if (!canScreenshot || !onScreenshot || !provider) return null;
  return async () => {
    onScreenshot(await takeScreenshot(provider, type, quality));
  };
}

export function Screenshot() {
  const onScreenshot = useScreenshotHanlder();
  if (!onScreenshot) return null;
  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      onClick={onScreenshot}
      aria-label="Capture screenshot"
    >
      <ImageDownIcon className="w-7 h-7" />
    </button>
  );
}

export function Timestamp() {
  const onTimestamp = useTimestamp();
  const player = useMediaPlayer();
  if (!player || !onTimestamp) return null;
  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      onClick={() => {
        onTimestamp(player.currentTime);
      }}
      aria-label="Take timestamp"
    >
      <PinIcon className="w-7 h-7" />
    </button>
  );
}

export function Next() {
  const onPlaylistChange = usePlaylistChange();
  const playlist = usePlaylist()[0];
  if (!playlist || !onPlaylistChange) return null;
  const curr = playlist.list[playlist.active];
  if (!(curr && isWithMedia(curr))) return null;
  const next = findWithMedia(
    playlist.list,
    (li) => !curr.media.compare(li.media),
    { fromIndex: playlist.active + 1 },
  );
  if (!next) return null;
  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      onClick={() => {
        onPlaylistChange(next, playlist);
      }}
      aria-label={`Next: ${next.title}`}
    >
      <NextIcon className="w-7 h-7" />
    </button>
  );
}
export function Previous() {
  const onPlaylistChange = usePlaylistChange();
  const playlist = usePlaylist()[0];
  if (!playlist || !onPlaylistChange) return null;
  const curr = playlist.list[playlist.active];
  if (!(curr && isWithMedia(curr))) return null;
  const prev = findWithMedia(
    playlist.list,
    (li) => !curr.media.compare(li.media),
    { fromIndex: playlist.active - 1, reverse: true },
  );
  if (!prev) return null;
  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      onClick={() => {
        onPlaylistChange(prev, playlist);
      }}
      aria-label={`Prev: ${prev.title}`}
    >
      <PreviousIcon className="w-7 h-7" />
    </button>
  );
}

export const dataLpPassthrough = "data-lp-pass-through";
