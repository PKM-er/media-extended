import { Platform } from "obsidian";
import { noHashUrl } from "@/lib/url";
import { removeHashTempFragment, type URLResolver } from "./base";
import { MediaHost } from "./supported";

export const genericResolver: URLResolver = (url) => {
  return {
    type: MediaHost.Generic,
    cleaned: noHashUrl(url),
    source: removeHashTempFragment(
      url.protocol === "file:" ? toAppUrl(url) : url,
    ),
  };
};

function toAppUrl(url: URL) {
  const fixed = new URL(
    Platform.resourcePathPrefix + url.href.substring("file:///".length),
  );
  fixed.search = Date.now().toString();
  return fixed;
}
