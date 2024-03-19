import { Platform } from "obsidian";
import { parseTempFrag } from "@/lib/hash/temporal-frag";
import { noHashUrl } from "@/lib/url";
import { MediaHost } from "../../info/supported";
import { removeHashTempFragment, type URLResolver } from "./base";

export const genericResolver: URLResolver = (url) => {
  return {
    type: MediaHost.Generic,
    cleaned: noHashUrl(url),
    source: removeHashTempFragment(
      url.protocol === "file:" ? toAppUrl(url) : url,
    ),
    tempFrag: parseTempFrag(url.hash),
  };
};

function toAppUrl(url: URL) {
  const fixed = new URL(
    Platform.resourcePathPrefix + url.href.substring("file:///".length),
  );
  fixed.search = Date.now().toString();
  return fixed;
}
