import "./controls.less";

import React from "react";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  seekTo,
  setFragment,
  setPlaybackRate,
  setVolume,
  setVolumeByOffest,
  toggleMute,
  togglePlay,
  userSeekEnd,
  userSeeking,
  userSeekStart,
} from "../slice/controls";
import { resetProvider, setProvider } from "../slice/provider";
import useFullScreen from "./fullscreen";

const video = {
  from: "video",
  sources: ["/View_From_A_Blue_Moon_Trailer-720p.mp4"],
  tracks: [
    {
      kind: "subtitles",
      src: "/View_From_A_Blue_Moon_Trailer-HD.en.vtt",
      srcLang: "en",
      label: "English",
      default: true,
    },
  ],
};
const audioOnlyWebm = {
  from: "video",
  sources: ["/audio-only.webm"],
};
const recording = {
  from: "audio",
  sources: ["/duration.webm"],
};
const youtube1 = {
  from: "youtube",
  sources: ["https://www.youtube.com/watch?v=bHQqvYy5KYo"],
};
const youtube2 = {
  from: "youtube",
  sources: ["https://www.youtube.com/watch?v=5GpM1ltMv88"],
};
const youtube43 = {
  from: "youtube",
  sources: ["https://www.youtube.com/watch?v=ymspNPoaBIs"],
};

const ProgressBar = () => {
  const dispatch = useAppDispatch();

  const currentTime = useAppSelector((state) => state.controls.currentTime),
    seekTime = useAppSelector((state) => state.controls.userSeek?.currentTime),
    duration = useAppSelector((state) => state.controls.duration),
    buffered = useAppSelector((state) => state.controls.buffered);

  return (
    <div className="progress">
      <input
        type="range"
        min="0"
        step="0.01"
        max={duration ?? 100}
        value={seekTime ?? currentTime}
        onPointerDown={(evt) => {
          dispatch(
            userSeekStart((evt.target as HTMLInputElement).valueAsNumber),
          );
        }}
        onChange={(evt) => {
          dispatch(userSeeking((evt.target as HTMLInputElement).valueAsNumber));
        }}
        onPointerUp={(evt) => {
          dispatch(userSeekEnd());
        }}
        autoComplete="off"
      />
      <progress value={duration ? buffered / duration : 0} max="1" />
    </div>
  );
};
const ProgressLabel = () => {
  const seeking = useAppSelector((state) => state.controls.seeking),
    currentTime = useAppSelector((state) => state.controls.currentTime),
    duration = useAppSelector((state) => state.controls.duration);

  return (
    <span>
      time: {currentTime.toFixed(3)} / {duration} {seeking && "(seeking)"}
    </span>
  );
};

const ProviderSelector = () => {
  const dispatch = useAppDispatch();

  return (
    <div>
      <button aria-label="reset" onClick={() => dispatch(resetProvider())}>
        reset
      </button>
      <button onClick={() => dispatch(setProvider(video as any))}>video</button>
      <button onClick={() => dispatch(setProvider(audioOnlyWebm as any))}>
        audioonly
      </button>
      <button onClick={() => dispatch(setProvider(recording as any))}>
        recording
      </button>
      <button onClick={() => dispatch(setProvider(youtube1 as any))}>
        youtube1
      </button>
      <button onClick={() => dispatch(setProvider(youtube2 as any))}>
        youtube2
      </button>
      <button onClick={() => dispatch(setProvider(youtube43 as any))}>
        youtube 4:3
      </button>
    </div>
  );
};

const Volume = () => {
  const dispatch = useAppDispatch();

  const volume = useAppSelector((state) => state.controls.volume),
    muted = useAppSelector((state) => state.controls.muted);

  return (
    <div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(evt) =>
          evt.target.validity.valid &&
          dispatch(setVolume(evt.target.valueAsNumber))
        }
        disabled={muted}
      />
      <button onClick={() => dispatch(setVolumeByOffest(5))}>vol +</button>
      <button onClick={() => dispatch(setVolumeByOffest(-5))}>vol -</button>
      <button aria-label="mute" onClick={() => dispatch(toggleMute())}>
        {!muted ? "mute" : "unmute"}
      </button>
    </div>
  );
};

const Buttons = ({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  const dispatch = useAppDispatch();

  const paused = useAppSelector((state) => state.controls.paused),
    rate = useAppSelector((state) => state.controls.playbackRate);

  const { enterFullscreen, exitFullscreen, fullscreen } =
    useFullScreen(containerRef);

  return (
    <div>
      <button
        aria-label="timestamp"
        onClick={() => dispatch(setFragment({ start: 10, end: 12 }))}
      >
        frag
      </button>
      <button
        aria-label="toggle"
        onClick={() => {
          dispatch(togglePlay());
        }}
      >
        {paused ? "play" : "pause"}
      </button>
      <button
        aria-label="fullscreen"
        onClick={() => {
          !fullscreen ? enterFullscreen() : exitFullscreen();
        }}
      >
        {!fullscreen ? "enterfs" : "exitfs"}
      </button>
      <button
        aria-label="seekto10"
        onClick={() => {
          dispatch(seekTo(10));
        }}
      >
        seek to 10
      </button>
      <input
        type="number"
        min="0.2"
        step="0.1"
        value={rate}
        onChange={(evt) =>
          evt.target.validity.valid &&
          dispatch(setPlaybackRate(evt.target.valueAsNumber))
        }
      />
    </div>
  );
};

const Controls = ({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  return (
    <div>
      <ProviderSelector />
      <Buttons containerRef={containerRef} />
      <Volume />
      <div>
        <ProgressBar />
        <ProgressLabel />
      </div>
    </div>
  );
};
export default Controls;
