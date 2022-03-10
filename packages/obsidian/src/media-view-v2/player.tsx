import "@vidstack/player/define/vds-audio-player.js";
import "@vidstack/player/define/vds-video-player.js";
import "@vidstack/player/define/vds-media-ui.js";
import "@vidstack/player/define/vds-play-button.js";
import "@vidstack/player/define/vds-media-visibility.js";
import "@vidstack/player/define/vds-time-slider.js";
import "@vidstack/player/define/vds-fullscreen-button.js";
import "@vidstack/player/define/vds-slider-value-text.js";
import "./player.less";

import type {
  FullscreenButtonElement,
  MediaUiElement,
  PlayButtonElement,
  SliderElement,
  SliderValueTextElement,
  VideoPlayerElement,
} from "@vidstack/player";
import { setIcon } from "obsidian";
import React from "react";
import { useEffect, useRef } from "react";

import MediaView from "./view";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vds-video-player": React.HTMLProps<VideoPlayerElement>;
      "vds-media-ui": React.HTMLProps<MediaUiElement>;
      "vds-play-button": React.HTMLProps<PlayButtonElement>;
      "vds-time-slider": React.HTMLProps<SliderElement>;
      "vds-fullscreen-button": React.HTMLProps<FullscreenButtonElement>;
      "vds-slider-value-text": Partial<SliderValueTextElement>;
    }
  }
}

interface PlayerProps {
  src: URL;
  view?: MediaView;
}

const Player = ({ src, view }: PlayerProps) => {
  const playBtnRef = useRef<PlayButtonElement>(null);
  const fullscreenBtnRef = useRef<FullscreenButtonElement>(null);
  const playerRef = useRef<VideoPlayerElement>(null);
  useEffect(() => {
    playBtnRef.current!.append(getIcon("play", 24), getIcon("pause", 24));
    fullscreenBtnRef.current!.append(
      getIcon("expand", 24),
      getIcon("minimize", 24),
    );
    if (view) {
      view.player = playerRef.current!;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <vds-video-player src={src.toString()} ref={playerRef}>
      <vds-media-ui slot="ui">
        <div className="controls">
          <vds-play-button ref={playBtnRef} />
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
          <vds-fullscreen-button ref={fullscreenBtnRef} />
        </div>
      </vds-media-ui>
    </vds-video-player>
  );
};
export default Player;

const getIcon = (id: string, size: number = 24): SVGElement => {
  const div = createDiv();
  setIcon(div, id, size);
  return div.firstElementChild as SVGElement;
};
