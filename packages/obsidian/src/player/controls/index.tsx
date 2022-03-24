import "@vidstack/player/define/vds-play-button.js";
import "@vidstack/player/define/vds-fullscreen-button.js";
import "@vidstack/player/define/vds-mute-button.js";
import "./buttons.less";
import "./basic.less";
import "./sliders.less";

import type {
  FullscreenButtonElement,
  PlayButtonElement,
} from "@vidstack/player";
import React from "preact/compat";

import { useIcon } from "../utils";
import ProgressBar from "./progress";
import ScreenshotButton from "./screenshot-btn";
import SpeedControl from "./speed";
import VolumeControl from "./volume";

declare module "preact/src/jsx" {
  namespace JSXInternal {
    interface IntrinsicElements {
      "vds-play-button": HTMLAttributes<PlayButtonElement>;
      "vds-fullscreen-button": HTMLAttributes<FullscreenButtonElement>;
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
      <SpeedControl />
      <vds-fullscreen-button ref={fullscreenBtn} />
    </div>
  );
};
export default PlayerControls;
