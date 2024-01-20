import BilibiliPlugin from "inline:./userscript/bilibili";
import YouTubePlugin from "inline:./userscript/youtube";
import type { SupportedWebHost } from "./match-webpage";

export const plugins = {
  bilibili: BilibiliPlugin,
  youtube: YouTubePlugin,
  generic: undefined,
} satisfies Record<SupportedWebHost, string | undefined>;
