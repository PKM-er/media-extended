import BilibiliPlugin from "inline:./userscript/bilibili";
import YouTubePlugin from "inline:./userscript/youtube";
import type { SupportedMediaHost } from "./url-match/supported";

export const plugins = {
  bilibili: BilibiliPlugin,
  youtube: YouTubePlugin,
  vimeo: undefined,
  generic: undefined,
} satisfies Record<SupportedMediaHost, string | undefined>;
