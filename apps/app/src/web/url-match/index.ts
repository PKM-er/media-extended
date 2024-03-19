import type { App } from "obsidian";
import type { MediaInfo } from "@/info/media-info";
import { mediaInfoFromFile } from "@/info/media-info";
import { checkMediaType } from "@/info/media-type";
import { MediaURL } from "@/info/media-url";
import { MediaHost } from "@/info/supported";
import type { MxSettings } from "@/settings/def";

import type { URLResolveResult, URLResolver } from "./base";
import { bilibiliDetecter, bilibiliResolver } from "./bilibili";
import { courseraDetecter, courseraResolver } from "./coursera";
import { genericResolver } from "./generic";
import { vimeoDetecter, vimeoResolver } from "./vimeo";
import { youtubeDetecter, youtubeResolver } from "./youtube";

export function resolveUrlMatcher(url: MediaURL) {
  const type =
    detecters.reduce<MediaHost | null>(
      (prev, detect) => prev ?? detect(url),
      null,
    ) ?? MediaHost.Generic;
  const resolved = Resolver[type](url);
  return { type, resolved };
}

export type { URLResolveResult };

const detecters = [
  bilibiliDetecter,
  youtubeDetecter,
  vimeoDetecter,
  courseraDetecter,
];
// eslint-disable-next-line @typescript-eslint/naming-convention
const Resolver: Record<MediaHost, URLResolver> = {
  [MediaHost.Bilibili]: bilibiliResolver,
  [MediaHost.YouTube]: youtubeResolver,
  [MediaHost.Vimeo]: vimeoResolver,
  [MediaHost.Coursera]: courseraResolver,
  [MediaHost.Generic]: genericResolver,
};

export function resolveUrl(url: MediaURL): URLResolveResult {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return genericResolver(url);
  }
  for (const resolve of [
    bilibiliResolver,
    youtubeResolver,
    vimeoResolver,
    courseraResolver,
  ]) {
    const result = resolve(url);
    if (result) return result;
  }
  return genericResolver(url);
}

export function resolveMxProtocol(
  src: URL | null,
  { getUrlMapping }: MxSettings,
  app: App,
): MediaInfo | null {
  if (!src) return null;
  if (src.protocol !== "mx:") return checkInVault(src);

  // custom protocol take // as part of the pathname
  const [, , mxProtocol] = src.pathname.split("/");
  const replace = getUrlMapping(mxProtocol);
  if (!replace) return null;
  return checkInVault(
    src.href.replace(`mx://${mxProtocol}/`, replace.replace(/\/*$/, "/")),
    src,
  );

  function checkInVault(url: string | URL, mx?: string | URL) {
    const media = MediaURL.create(url, mx);
    if (!media) return null;
    if (!media.isFileUrl) return media;
    const file = media.getVaultFile(app.vault);
    if (!file) {
      if (media.inferredType === null) return null;
      return media;
    }
    if (checkMediaType(file.extension) === null) return null;
    return mediaInfoFromFile(file, media.hash);
  }
}
