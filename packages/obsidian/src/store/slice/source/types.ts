import { MediaType } from "@base/media-type";
import assertNever from "assert-never";

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
type HTMLMedia = PlayerType.video | PlayerType.audio | PlayerType.unknown;

export const isHTMLMediaSource = (
  source: PlayerSource,
): source is HTMLMediaSource => !!source.type && isHTMLPlayerType(source.type);
export const isHTMLPlayerType = (type: PlayerType | null): type is HTMLMedia =>
  type === PlayerType.video ||
  type === PlayerType.audio ||
  type === PlayerType.unknown;

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

interface MediaSourceBase {
  type: PlayerType | null;
  /** url passed to player, may be converted */
  src: string | null;
}
interface NoMediaSource {
  type: null;
  src: null;
}
interface GeneralHostSource extends MediaSourceBase {
  type: PlayerType.generalHost;
  src: string;
}
export interface HTMLMediaSource extends MediaSourceBase {
  type: HTMLMedia;
  src: string;
  tracks: Track[];
  allowCORS: boolean;
}
interface YouTubeAPISource extends MediaSourceBase {
  type: PlayerType.youtubeAPI;
  src: string;
  id: string;
}
interface VimeoAPISource extends MediaSourceBase {
  type: PlayerType.vimeoAPI;
  src: string;
  id: string;
}
interface BilibiliSource extends MediaSourceBase {
  type: PlayerType.bilibili;
  src: string;
  id: string;
}

export type HostMediaSource =
  | YouTubeAPISource
  | VimeoAPISource
  | BilibiliSource;
export type PlayerSource =
  | NoMediaSource
  | HTMLMediaSource
  | YouTubeAPISource
  | VimeoAPISource
  | BilibiliSource;

interface Subtitle {
  src: string;
  kind: "subtitles";
  // must be a valid BCP 47 language tag
  srcLang?: string;
  label?: string;
  default?: boolean;
}
interface Caption {
  src: string;
  kind: "captions";
  default: boolean;
}

export type Track = Caption | Subtitle;
