import assertNever from "assert-never";
import type { MediaType } from "mx-base";

import { PlayerState } from "..";
import { HTML5MediaState } from "../html5";

export interface MediaSourceBase {
  /** url passed to player, may be converted */
  src: string;
}

export const enum PlayerType {
  video = 1,
  audio,
  /** media that cannot determine if html5 video/audio until loaded */
  unknown,
  youtubeAPI,
  vimeoAPI,
  bilibili,
  generalHost,
}
export type HTMLMediaType =
  | PlayerType.video
  | PlayerType.audio
  | PlayerType.unknown;

export const isHTMLPlayerType = (
  type: PlayerType | null,
): type is HTMLMediaType =>
  type === PlayerType.video ||
  type === PlayerType.audio ||
  type === PlayerType.unknown;
export const isHTMLMediaState = (
  state: PlayerState,
): state is HTML5MediaState => isHTMLPlayerType(state.type);

export const mediaTypeToPlayerType = (type: MediaType) => {
  switch (type) {
    case "video":
      return PlayerType.video;
    case "audio":
      return PlayerType.audio;
    case "unknown":
      return PlayerType.unknown;
    default:
      assertNever(type);
  }
};
