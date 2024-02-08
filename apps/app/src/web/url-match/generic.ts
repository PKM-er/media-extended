import { Platform } from "obsidian";
import { noHashUrl } from "@/lib/url";
import type { URLResolveResult } from "./base";
import { SupportedMediaHost } from "./supported";

export const genericResolver = (url: URL): URLResolveResult => {
  return {
    type: SupportedMediaHost.Generic,
    cleaned: noHashUrl(url),
    source: url.protocol === "file:" ? toAppUrl(url) : url,
  };
};

function toAppUrl(url: URL) {
  const fixed = new URL(
    url.href.substring("file:///".length),
    Platform.resourcePathPrefix,
  );
  fixed.search = Date.now().toString();
  return fixed;
}
