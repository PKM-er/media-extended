import "@styles/controls.less";

import React from "react";

import {
  CaptionButton,
  DanmakuButton,
  FullscreenButton,
  PlayButton,
  ScreenshotButton,
  TimestampButton,
} from "./buttons";
import ProgressBar from "./progress-bar";
import ProgressLabel from "./progress-label";
import SpeedControl from "./speed";
import VolumeControl from "./volume";

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
          <div className="mx__controls-bottom-center"></div>
          <div className="mx__controls-bottom-right">
            <DanmakuButton />
            <CaptionButton />
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
