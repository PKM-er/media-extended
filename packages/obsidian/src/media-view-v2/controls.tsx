import "@aidenlx/player/define/vds-play-button.js";
import "@aidenlx/player/define/vds-timespan-slider.js";
import "@aidenlx/player/define/vds-fullscreen-button.js";
import "@aidenlx/player/define/vds-slider-value-text.js";

import type {
  FullscreenButtonElement,
  PlayButtonElement,
  SliderElement,
  SliderValueTextElement,
} from "@aidenlx/player";
import { setIcon } from "obsidian";
import React from "react";
import { useEffect, useRef } from "react";
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vds-play-button": React.HTMLProps<PlayButtonElement>;
      "vds-timespan-slider": React.HTMLProps<SliderElement>;
      "vds-fullscreen-button": React.HTMLProps<FullscreenButtonElement>;
      "vds-slider-value-text": Partial<SliderValueTextElement>;
    }
  }
}

export interface ControlsProps {
  min?: number;
  max?: number;
}

const PlayerControls = ({ min, max }: ControlsProps) => {
  const playBtn = useIcon<PlayButtonElement>(["play", "pause"]);
  const fullscreenBtn = useIcon<FullscreenButtonElement>([
    "expand",
    "minimize",
  ]);
  return (
    <div className="controls">
      <vds-play-button ref={playBtn} />
      <vds-timespan-slider min={min} max={max}>
        <vds-slider-value-text
          type="pointer"
          format="time"
        ></vds-slider-value-text>
        <div className="slider-track"></div>
        <div className="slider-track fill"></div>
        <div className="slider-thumb-container">
          <div className="slider-thumb"></div>
        </div>
      </vds-timespan-slider>
      <vds-fullscreen-button ref={fullscreenBtn} />
    </div>
  );
};
export default PlayerControls;

const useIcon = <T extends HTMLElement>(icons: string[], size = 24) => {
  let tempContainer = createDiv();
  const ref = useRef<T>(null);
  useEffect(() => {
    if (ref.current) {
      for (const id of icons) {
        setIcon(tempContainer, id, size);
        ref.current.append(tempContainer.firstElementChild as SVGElement);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
};
