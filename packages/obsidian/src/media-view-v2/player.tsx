import "@vidstack/player/define/vds-audio-player.js";
import "@vidstack/player/define/vds-video-player.js";
import "@vidstack/player/define/vds-media-ui.js";
import "./player.less";

import type {
  AudioPlayerElement,
  MediaUiElement,
  VideoPlayerElement,
} from "@vidstack/player";
import assertNever from "assert-never";
import { EventRef } from "obsidian";
import React from "react";
import { useEffect, useRef, useState } from "react";

import { InternalMediaInfo } from "../base/media-info";
import { MediaType } from "../base/media-type";
import PlayerControls from "./controls";
import { MediaViewEvents } from "./events";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vds-audio-player": React.HTMLProps<AudioPlayerElement>;
      "vds-video-player": React.HTMLProps<VideoPlayerElement>;
      "vds-media-ui": React.HTMLProps<MediaUiElement>;
    }
  }
}

interface PlayerProps {
  info: InternalMediaInfo;
  events?: MediaViewEvents;
  nativeControls?: boolean;
  onFocus?: React.FocusEventHandler<VideoPlayerElement | AudioPlayerElement>;
  onBlur?: React.FocusEventHandler<VideoPlayerElement | AudioPlayerElement>;
}

const Player = ({
  info,
  events,
  nativeControls = false,
  onFocus,
  onBlur,
}: PlayerProps) => {
  const playerRef = useRef<VideoPlayerElement | AudioPlayerElement>(null);

  const [mediaInfo, setMediaInfo] = useState(info);

  useEffect(() => {
    let refs: EventRef[] = [];
    if (events) {
      console.log("init", playerRef.current);
      if (playerRef.current) {
        events.trigger("player-init", playerRef.current);
      } else {
        events.trigger("player-destroy");
      }
      refs.push(
        events.on("file-loaded", (info) => {
          // check info different here
          console.log("recieved", info);
          setMediaInfo(info);
        }),
      );
    }
    return () => {
      events && refs.forEach(events.offref.bind(events));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const params = {
    tabIndex: 0,
    src: mediaInfo?.resourcePath,
    controls: nativeControls,
    onFocus,
    onBlur,
  };
  const ui = (
    <vds-media-ui slot="ui">
      {!nativeControls && <PlayerControls />}
    </vds-media-ui>
  );

  switch (mediaInfo.type) {
    case MediaType.Audio:
      return (
        <vds-audio-player ref={playerRef as any} {...params}>
          {ui}
        </vds-audio-player>
      );
    case MediaType.Video:
    case MediaType.Unknown:
      return (
        <vds-video-player ref={playerRef as any} {...params}>
          {ui}
        </vds-video-player>
      );
    default:
      assertNever(mediaInfo.type);
  }
};
export default Player;
