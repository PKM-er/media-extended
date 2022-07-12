import { Provider } from "mx-base";

import { BasicPlayerStatus } from "../typings";
import { WithMediaState } from "./base";
import { MediaUrlMetaBase } from "./base/meta";
import { MediaSourceBase, PlayerType } from "./base/source";

export interface BilibiliState extends WithMediaState {
  type: PlayerType.bilibili;
  source: BilibiliSource;
  meta: BilibiliMeta;
  status: BilibiliStatus;
}

export interface BilibiliSource extends MediaSourceBase {
  id: string;
}

export interface BilibiliMeta extends MediaUrlMetaBase {
  provider: Provider.bilibili;
}

export interface BilibiliStatus extends BasicPlayerStatus {
  webFscreen: boolean;
  danmaku: boolean;
}
