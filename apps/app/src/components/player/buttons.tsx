import {
  CaptionButton,
  FullscreenButton,
  isTrackCaptionKind,
  MuteButton,
  PIPButton,
  PlayButton,
  SeekButton,
  useMediaState,
} from "@vidstack/react";
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
} from "@/components/icon";

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
