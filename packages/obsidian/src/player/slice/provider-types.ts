interface Caption {
  src: string;
  kind: "captions";
  default: boolean;
}
type HTML5PlayerType = "unknown" | "audio" | "video";
type BrowserViewType = "browser-view";
interface SourceBase {
  playerType: HTML5PlayerType | BrowserViewType | "youtube" | "vimeo" | null;
  src: string;
  title: string;
  linkTitle?: string;
}
export interface ObsidianMedia extends SourceBase {
  from: "obsidian";
  playerType: HTML5PlayerType;
  /** in-vault relative path for media file */
  path: string;
  filename: string;
}
export interface DirectLinkMedia extends SourceBase {
  from: "direct";
  playerType: HTML5PlayerType;
}
interface VideoHostMediaBase extends SourceBase {
  from: "youtube" | "bilibili" | "vimeo" | "general";
  playerType: "youtube" | "vimeo" | BrowserViewType;
  id: string;
  title: string;
}
interface BilibiliMedia extends VideoHostMediaBase {
  from: "bilibili";
  playerType: BrowserViewType;
}
interface GeneralHostMedia extends VideoHostMediaBase {
  from: "bilibili";
  playerType: BrowserViewType;
}
export interface YouTubeMedia extends VideoHostMediaBase {
  from: "youtube";
  playerType: "youtube";
}
interface VimeoMedia extends VideoHostMediaBase {
  from: "vimeo";
  playerType: "vimeo";
}
export type Source =
  | ObsidianMedia
  | DirectLinkMedia
  | BilibiliMedia
  | YouTubeMedia;
interface Subtitle {
  src: string;
  kind: "subtitles";
  // must be a valid BCP 47 language tag
  srcLang: string;
  label: string;
  default: boolean;
}
export type Track = Caption | Subtitle;
