import "@aidenlx/player/define/vds-audio-player.js";
import "@aidenlx/player/define/vds-video-player.js";
import "@aidenlx/player/define/vds-media-ui.js";

import type {
  AudioPlayerElement,
  MediaProviderElement,
  MediaUiElement,
  VideoPlayerElement,
} from "@aidenlx/player";
import assertNever from "assert-never";
import { parseTF } from "mx-lib";
import { EventRef } from "obsidian";
import { parse as parseQS } from "query-string";
import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { InternalMediaInfo } from "../base/media-info";
import { MediaType } from "../base/media-type";
import { MediaViewEvents } from "./events";
import { is, useFrag, useHashProps } from "./hash-tool";
import PlayerControls from "./ui";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vds-audio-player": React.HTMLProps<AudioPlayerElement>;
      "vds-video-player": React.HTMLProps<VideoPlayerElement>;
      "vds-media-ui": React.HTMLProps<MediaUiElement>;
    }
  }
}

export const enum ShowControls {
  none,
  native,
  full,
}
interface PlayerProps {
  info: InternalMediaInfo;
  events?: MediaViewEvents;
  controls?: ShowControls;
  onFocus?: React.FocusEventHandler<MediaProviderElement>;
  onBlur?: React.FocusEventHandler<MediaProviderElement>;
}

const Player = ({
  info,
  events,
  controls = ShowControls.full,
  onFocus,
  onBlur,
}: PlayerProps) => {
  const playerRef = useRef<MediaProviderElement>(null);

  const [mediaInfo, setMediaInfo] = useState(info);

  useEffect(() => {
    let refs: EventRef[] = [];
    if (events) {
      if (playerRef.current) {
        events.trigger("player-init", playerRef.current);
      } else {
        events.trigger("player-destroy");
      }
      refs.push(
        events.on("file-loaded", (info) => {
          setMediaInfo(info);
        }),
      );
    }
    return () => {
      events && refs.forEach(events.offref.bind(events));
    };
  }, [events]);

  const timeSpan = useMemo(() => parseTF(mediaInfo.hash), [mediaInfo.hash]);
  const hashQuery = useMemo(() => parseQS(mediaInfo.hash), [mediaInfo.hash]);
  const controlsEnabled = useMemo(() => is(hashQuery, "controls"), [hashQuery]);

  useFrag(timeSpan, playerRef);
  useHashProps(hashQuery, playerRef);
  if (controls === ShowControls.none && controlsEnabled) {
    controls = ShowControls.full;
  }

  const playerProps = useMemo(
      () => ({
        ref: playerRef as any,
        tabIndex: 0,
        src: mediaInfo.resourcePath,
        controls: controls === ShowControls.native,
        onFocus,
        onBlur,
      }),
      // update only when vault path changed
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [mediaInfo.src, controls, onFocus, onBlur],
    ),
    ui = useMemo(
      () => (
        <vds-media-ui slot="ui">
          {controls === ShowControls.full && (
            <PlayerControls
              min={timeSpan?.start}
              max={timeSpan?.end}
              boundary={playerRef}
            />
          )}
        </vds-media-ui>
      ),
      [controls, timeSpan?.end, timeSpan?.start],
    );

  switch (mediaInfo.type) {
    case MediaType.Audio:
      return <vds-audio-player {...playerProps}>{ui}</vds-audio-player>;
    case MediaType.Video:
    case MediaType.Unknown:
      return <vds-video-player {...playerProps}>{ui}</vds-video-player>;
    default:
      assertNever(mediaInfo.type);
  }
};
export default Player;
