import { Provider } from "mx-base";

import { BasicPlayerStatus } from "../typings";
import { WithMediaState } from "./base";
import { MediaUrlMetaBase, MetaBase } from "./base/meta";
import { HTMLMediaType, MediaSourceBase } from "./base/source";
import { Track } from "./base/track";

export type SerializableTFile = {
  path: string;
  name: string;
  basename: string;
  extension: string;
};

export interface HTML5MediaState extends WithMediaState {
  type: HTMLMediaType;
  source: HTMLMediaSource;
  meta: ObsidianMeta | HTMLMediaMeta;
  status: BasicPlayerStatus;
}

export interface HTMLMediaSource extends MediaSourceBase {
  tracks: Track[];
  allowCORS: boolean;
}

export interface ObsidianMeta extends MetaBase {
  provider: Provider.obsidian;
  title: string;
  file: SerializableTFile;
}
export interface HTMLMediaMeta extends MediaUrlMetaBase {
  provider: Provider.html5;
}
