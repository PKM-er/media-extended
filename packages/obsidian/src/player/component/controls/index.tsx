import "@styles/controls.less";

import { useAppDispatch, useAppSelector } from "@player/hooks";
import { setFragment } from "@slice/controls";
import { resetProvider, setMediaUrlSrc } from "@slice/provider";
import React from "react";

import {
  FullscreenButton,
  PlayButton,
  ScreenshotButton,
  TimestampButton,
} from "./buttons";
import ProgressBar from "./progress-bar";
import ProgressLabel from "./progress-label";
import SpeedControl from "./speed";
import VolumeControl from "./volume";

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

const SetFragmentButton = () => {
  const dispatch = useAppDispatch();

  return (
    <button
      aria-label="timestamp"
      onClick={() => dispatch(setFragment({ start: 10, end: 12 }))}
    >
      frag
    </button>
  );
};

const ProviderSelector = () => {
  const dispatch = useAppDispatch();

  return (
    <div>
      <button aria-label="reset" onClick={() => dispatch(resetProvider())}>
        reset
      </button>
      <button onClick={() => dispatch(setMediaUrlSrc(video.sources[0]))}>
        video
      </button>
      <button
        onClick={() => dispatch(setMediaUrlSrc(audioOnlyWebm.sources[0]))}
      >
        audioonly
      </button>
      <button onClick={() => dispatch(setMediaUrlSrc(recording.sources[0]))}>
        recording
      </button>
      <button onClick={() => dispatch(setMediaUrlSrc(youtube1.sources[0]))}>
        youtube1
      </button>
      <button onClick={() => dispatch(setMediaUrlSrc(youtube2.sources[0]))}>
        youtube2
      </button>
      <button onClick={() => dispatch(setMediaUrlSrc(youtube43.sources[0]))}>
        youtube 4:3
      </button>
    </div>
  );
};

const Controls = () => {
  return (
    <div className="mx__controls-warp">
      <div className="mx__controls">
        <div className="mx__controls-top">
          <ProgressBar />
        </div>
        <div className="mx__controls-bottom">
          <div className="mx__controls-bottom-left">
            <PlayButton />
            <ProgressLabel />
          </div>
          <div className="mx__controls-bottom-center">
            <SetFragmentButton />
          </div>
          <div className="mx__controls-bottom-right">
            <ScreenshotButton />
            <TimestampButton />
            <SpeedControl />
            <VolumeControl />
            <FullscreenButton />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Controls;
