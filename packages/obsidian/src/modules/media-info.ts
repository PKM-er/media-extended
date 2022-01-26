import {
  DirectLinkInfo,
  getMediaInfo as getMediaInfo0,
  HostMediaInfo,
  MediaInfoType,
  MediaType,
  ObsidianMediaInfo,
} from "mx-lib";
import {
  App,
  MarkdownPostProcessorContext,
  parseLinktext,
  Platform,
  TFile,
  Vault,
} from "obsidian";

import { getBiliRedirectUrl } from "../misc";
import { getSubtitles, trackInfo } from "./subtitle";
import { getSubtitleTracks } from "./subtitle";
export interface InternalMediaInfo extends ObsidianMediaInfo {
  trackInfo?: trackInfo;
  updateTrackInfo(
    this: InternalMediaInfo,
    vault: Vault,
  ): Promise<trackInfo | null>;
  getSrcFile(this: InternalMediaInfo, vault: Vault): TFile;
}

const obHandler = (
  file: TFile,
  hash: string,
  type: MediaType,
): InternalMediaInfo => {
  if (!hash.startsWith("#")) hash = "#" + hash;
  const sub = getSubtitles(file);
  return {
    from: MediaInfoType.Obsidian,
    type,
    filename: file.name,
    src: file.path,
    subtitles: sub ? sub.map((f) => f.path) : [],
    hash,
    updateTrackInfo,
    getSrcFile,
  };
};
const getBiliFullLink = async (src: URL): Promise<URL> => {
  if (src.hostname !== "b23.tv" || !Platform.isDesktopApp) return src;
  try {
    const newUrl = await getBiliRedirectUrl(src.pathname.split("/")[1]);
    return new URL(newUrl);
  } catch (err) {
    console.error(err);
    return src;
  }
};
export type MediaInfo = InternalMediaInfo | HostMediaInfo | DirectLinkInfo;
export const getMediaInfo = async (
  src: string | { file: TFile; hash: string },
) => {
  let source: URL | { file: TFile; hash: string };
  if (typeof src === "string") {
    try {
      source = new URL(src);
      source = await getBiliFullLink(source);
    } catch (error) {
      return null;
    }
  } else source = src;
  return getMediaInfo0(source, { obsidian: obHandler });
};

/**
 * get links that is safe to use in obsidian
 */
export const getLink = (
  ...args: [info: InternalMediaInfo, vault: Vault] | [info: DirectLinkInfo]
): URL => {
  const [info, vault] = args;
  if (info.from === MediaInfoType.Obsidian) {
    if (!vault) throw new Error("vault not provided");
    const { src, hash } = info;
    const file = vault.getAbstractFileByPath(src);
    if (file && file instanceof TFile) {
      const resourcePath = vault.getResourcePath(file);
      return new URL(resourcePath + hash);
    } else throw new Error("no file found for path: " + src);
  } else {
    const { src } = info;
    if (src.protocol === "file:")
      return new URL(src.href.replace(/^file:\/\/\//, "app://local/"));
    else return src;
  }
};

export const resolveInfo = async (
  el: Element,
  type: string,
  app: App,
  ctx: MarkdownPostProcessorContext,
) => {
  if (type === "internal") {
    const linktext =
      el instanceof HTMLAnchorElement ? el.dataset.href : el.getAttr("src");
    if (!linktext) {
      console.error("no linktext in internal embed: %o, escaping", el);
      return null;
    }
    // resolve linktext, check if exist
    const { subpath: hash, path } = parseLinktext(linktext);
    const file = app.metadataCache.getFirstLinkpathDest(
      path,
      ctx.sourcePath,
    ) as TFile | null;

    return file ? getMediaInfo({ file, hash }) : null;
  } else {
    const src = el instanceof HTMLAnchorElement ? el.href : el.getAttr("src");
    if (!src) {
      console.info("fail to get embed src: %o, escaping", el);
      return null;
    } else return getMediaInfo(src);
  }
};

export async function updateTrackInfo(this: InternalMediaInfo, vault: Vault) {
  if (this.subtitles.length > 0) {
    const track = await getSubtitleTracks(this.subtitles, vault);
    this.trackInfo = track;
    return track;
  } else return null;
}
export function getSrcFile(this: InternalMediaInfo, vault: Vault) {
  const aFile = vault.getAbstractFileByPath(this.src);
  if (aFile && aFile instanceof TFile) return aFile;
  else throw new Error("src file not found for path: " + this.src);
}
