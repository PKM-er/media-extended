import "@aidenlx/player/define/vds-play-button.js";
import "@aidenlx/player/define/vds-timespan-slider.js";
import "@aidenlx/player/define/vds-fullscreen-button.js";
import "@aidenlx/player/define/vds-mute-button.js";
import "@aidenlx/player/define/vds-slider-value-text.js";
import "./buttons.less";
import "./basic.less";
import "./sliders.less";

import type {
  FullscreenButtonElement,
  MediaProviderElement,
  MuteButtonElement,
  PlayButtonElement,
  SliderElement,
  SliderValueTextElement,
} from "@aidenlx/player";
import { TimeSpan } from "mx-lib";
import React from "react";

import ProgressBar from "./progress";
import ScreenshotButton from "./screenshot-btn";
import { useIcon } from "./utils";
import VolumeControl from "./volume";
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vds-play-button": React.HTMLProps<PlayButtonElement>;
      "vds-timespan-slider": React.HTMLProps<SliderElement>;
      "vds-fullscreen-button": React.HTMLProps<FullscreenButtonElement>;
      "vds-mute-button": React.HTMLProps<MuteButtonElement>;
      "vds-slider-value-text": Partial<SliderValueTextElement>;
    }
  }
}

const PlayerControls = () => {
  const playBtn = useIcon<PlayButtonElement>(["play", "pause"]);
  const fullscreenBtn = useIcon<FullscreenButtonElement>([
    "expand",
    "minimize",
  ]);
  return (
    <div className="controls">
      <vds-play-button ref={playBtn} />
      <ProgressBar />
      <VolumeControl />
      <ScreenshotButton />
      <vds-fullscreen-button ref={fullscreenBtn} />
    </div>
  );
};
export default PlayerControls;
