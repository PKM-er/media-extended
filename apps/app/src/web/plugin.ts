import BilibiliPlugin from "inline:./userscript/bilibili";
import VimeoPlugin from "inline:./userscript/vimeo";
import YouTubePlugin from "inline:./userscript/youtube";
import type { MediaHost } from "./url-match/supported";

export const plugins = {
  bilibili: BilibiliPlugin,
  youtube: YouTubePlugin,
  vimeo: VimeoPlugin,
  coursera: undefined,
  generic: undefined,
} satisfies Record<MediaHost, string | undefined>;
