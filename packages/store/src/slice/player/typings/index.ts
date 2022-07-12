import type { NoMediaState } from "./base";
import type { BilibiliState } from "./bilibili";
import type { HTML5MediaState } from "./html5";
import type { YouTubeAPIState } from "./youtube-api";

export type PlayerState = NoMediaState | PlayerWithMediaState;
export type { SerializableTFile } from "./html5";

type PlayerWithMediaState = BilibiliState | HTML5MediaState | YouTubeAPIState;

export type {
  MediaMeta,
  NoMediaState,
  PlayerSource,
  WithMediaState,
} from "./base";
export {
  isHTMLMediaState,
  isHTMLPlayerType,
  mediaTypeToPlayerType,
  PlayerType,
} from "./base/source";
export type { BasicPlayerStatus } from "./base/status";
export type { Caption, Subtitle, Track } from "./base/track";
