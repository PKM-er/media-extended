import "@vidstack/player/define/vds-play-button.js";
import "@vidstack/player/define/vds-time-slider.js";
import "@vidstack/player/define/vds-fullscreen-button.js";
import "@vidstack/player/define/vds-slider-value-text.js";

import type {
  FullscreenButtonElement,
  PlayButtonElement,
  SliderElement,
  SliderValueTextElement,
} from "@vidstack/player";
import { setIcon } from "obsidian";
import React from "react";
import { useEffect, useRef } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vds-play-button": React.HTMLProps<PlayButtonElement>;
      "vds-time-slider": React.HTMLProps<SliderElement>;
      "vds-fullscreen-button": React.HTMLProps<FullscreenButtonElement>;
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
      <vds-time-slider>
        <vds-slider-value-text
          type="pointer"
          format="time"
        ></vds-slider-value-text>
        <div className="slider-track"></div>
        <div className="slider-track fill"></div>
        <div className="slider-thumb-container">
          <div className="slider-thumb"></div>
        </div>
      </vds-time-slider>
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
