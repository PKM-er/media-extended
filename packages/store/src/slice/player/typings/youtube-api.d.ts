import { Provider } from "mx-base";

import { WithMediaState } from "./base";
import { MediaUrlMetaBase } from "./base/meta";
import { MediaSourceBase, PlayerType } from "./base/source";
import { BasicPlayerStatus } from "./base/status";

export interface YouTubeAPIState extends WithMediaState {
  type: PlayerType.youtubeAPI;
  source: YouTubeAPISource;
  meta: YouTubeMeta;
  status: YoutubeAPIStatus;
}

export interface YouTubeAPISource extends MediaSourceBase {
  id: string;
}

export interface YouTubeMeta extends MediaUrlMetaBase {
  provider: Provider.youtube;
}

export interface YoutubeAPIStatus extends BasicPlayerStatus {
  availableSpeeds: number[];
  YTAPIStatus: "none" | "loading" | "error" | "inited" | "ready";
  YTPlayerState: YT.PlayerState | null;
}
