import BilibiliPlugin from "inline:./userscript/bilibili";
import type { SupportedWebHost } from "./match-webpage";

export const plugins = {
  bilibili: BilibiliPlugin,
  generic: undefined,
} satisfies Record<SupportedWebHost, string | undefined>;
