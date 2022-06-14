import { Provider } from "mx-base";

export type SerializableTFile = {
  path: string;
  name: string;
  basename: string;
  extension: string;
};

interface MetaBase {
  provider: Provider | null;
  title?: string;
  details?: string;
  linkTitle?: string;
}
interface MediaUrlMetaBase extends MetaBase {
  /** source given url, hash stripped */
  url: string;
  id?: string;
}
interface NoMeta extends MetaBase {
  provider: null;
}
export interface ObsidianMeta extends MetaBase {
  provider: Provider.obsidian;
  title: string;
  file: SerializableTFile;
}
export interface HTMLMediaMeta extends MediaUrlMetaBase {
  provider: Provider.html5;
}
export interface YouTubeMeta extends MediaUrlMetaBase {
  provider: Provider.youtube;
}
interface VimeoMeta extends MediaUrlMetaBase {
  provider: Provider.vimeo;
}
export interface BilibiliMeta extends MediaUrlMetaBase {
  provider: Provider.bilibili;
}
interface CustomHostMeta extends MediaUrlMetaBase {
  provider: Provider.generalHost;
}
export type MediaMeta =
  | NoMeta
  | ObsidianMeta
  | HTMLMediaMeta
  | YouTubeMeta
  | VimeoMeta
  | BilibiliMeta
  | CustomHostMeta;
