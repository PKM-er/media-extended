import "@vidstack/player/define/vds-audio-player.js";
import "@vidstack/player/define/vds-video-player.js";
import "@vidstack/player/define/vds-media-ui.js";
import "./player.less";

import type {
  AudioPlayerElement,
  MediaUiElement,
  VideoPlayerElement,
} from "@vidstack/player";
import React from "react";
import { useEffect, useRef } from "react";

import PlayerControls from "./controls";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vds-video-player": React.HTMLProps<VideoPlayerElement>;
      "vds-media-ui": React.HTMLProps<MediaUiElement>;
    }
  }
}

interface PlayerProps {
  src: URL;
  view?: Record<"player", VideoPlayerElement | AudioPlayerElement | null>;
  nativeControls?: boolean;
  onFocus?: React.FocusEventHandler<VideoPlayerElement>;
  onBlur?: React.FocusEventHandler<VideoPlayerElement>;
}

const Player = ({
  src,
  view,
  nativeControls = false,
  onFocus,
  onBlur,
}: PlayerProps) => {
  const playerRef = useRef<VideoPlayerElement>(null);

  useEffect(() => {
    if (view) {
      view.player = playerRef.current!;
    }
    return () => {
      // console.log("unloaded");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <vds-video-player
      tabIndex={0}
      src={src.toString()}
      ref={playerRef}
      controls={nativeControls}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <vds-media-ui slot="ui">
        {!nativeControls && <PlayerControls />}
      </vds-media-ui>
    </vds-video-player>
  );
};
export default Player;
