import { enumerate } from "@ipc/must-include";

interface Caption {
  src: string;
  kind: "captions";
  default: boolean;
}

type HTML5PlayerType = "unknown" | "audio" | "video";
export const HTML5PlayerTypes = enumerate<HTML5PlayerType>()(
  "unknown",
  "audio",
  "video",
);

export type Providers = "youtube" | "bilibili" | "vimeo";

type WebViewType = "webview";
interface SourceBase {
  playerType: HTML5PlayerType | WebViewType | "youtube" | "vimeo" | null;
  src: string;
  title: string | null;
  linkTitle?: string;
}
export interface ObsidianMedia extends SourceBase {
  from: "obsidian";
  playerType: HTML5PlayerType;
  /** in-vault absolute path for media file */
  path: string;
  filename: string;
}
export interface DirectLinkMedia extends SourceBase {
  from: "direct";
  playerType: HTML5PlayerType;
}
interface VideoHostMediaBase extends SourceBase {
  from: Providers | "general";
  playerType: "youtube" | "vimeo" | WebViewType;
  id: string;
  title: string | null;
}
export interface BilibiliMedia extends VideoHostMediaBase {
  from: "bilibili";
  playerType: WebViewType;
}
interface GeneralHostMedia extends VideoHostMediaBase {
  from: "bilibili";
  playerType: WebViewType;
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
