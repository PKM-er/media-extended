import {
  App,
  MarkdownPostProcessorContext,
  parseLinktext,
  TFile,
  Vault,
} from "obsidian";

import { getSubtitles, trackInfo } from "./subtitle";
import { getSubtitleTracks } from "./subtitle";

export enum Host {
  youtube,
  bili,
  vimeo,
}

type mediaType = "audio" | "video" | "media";
export const acceptedExt: Map<mediaType, string[]> = new Map([
  ["audio", ["mp3", "wav", "m4a", "ogg", "3gp", "flac"]],
  ["video", ["mp4", "ogv"]],
  ["media", ["webm"]],
]);

export const getMediaType = (src: string | URL | TFile): mediaType | null => {
  // if url contains no extension, type = null
  let ext: string | null = null;
  if (src instanceof TFile) {
    ext = src.extension;
  } else if (typeof src === "string") {
    const { path } = parseLinktext(src);
    if (path.includes(".")) {
      ext = path.split(".").pop() as string;
    }
  } else if (src.pathname.includes(".")) {
    ext = src.pathname.split(".").pop() as string;
  }
  if (!ext) return null;

  let fileType: mediaType | null = null;
  for (const [type, extList] of acceptedExt) {
    if (extList.includes(ext)) fileType = type;
  }
  return fileType;
};

export type mediaInfo = mediaInfo_Direct | mediaInfo_Host | mediaInfo_Internal;

export interface mediaInfo_Internal {
  hash: string;
  type: mediaType;
  filename: string;
  /** path for media file */
  src: string;
  /** paths for subtitles, could be empty */
  subtitles: string[];
  trackInfo?: trackInfo;
  updateTrackInfo(
    this: mediaInfo_Internal,
    vault: Vault,
  ): Promise<trackInfo | null>;
  getSrcFile(this: mediaInfo_Internal, vault: Vault): TFile;
}
export const isInternal = (info: mediaInfo): info is mediaInfo_Internal =>
  Array.isArray((info as mediaInfo_Internal).subtitles);

export interface mediaInfo_Direct {
  hash: string;
  type: mediaType;
  filename: string;
  src: URL;
}
export const isDirect = (info: mediaInfo): info is mediaInfo_Direct =>
  !isInternal(info) && !isHost(info);

export interface mediaInfo_Host {
  hash: string;
  host: Host;
  id: string;
  iframe: URL;
  src: URL;
}
export const isHost = (info: mediaInfo): info is mediaInfo_Host =>
  (info as mediaInfo_Host).host !== undefined &&
  (info as mediaInfo_Host).id !== undefined;

export const getVideoInfo = async (
  ...args: [src: URL | string] | [src: TFile, hash: string]
): Promise<mediaInfo | null> => {
  let [src, hash] = args;
  if (typeof src === "string") {
    try {
      src = new URL(src);
    } catch (error) {
      return null;
    }
  }

  const mediaType = getMediaType(src);

  if (mediaType) {
    // Internal
    if (src instanceof TFile) {
      if (!hash) hash = "";
      else if (!hash.startsWith("#")) hash = "#" + hash;
      const sub = getSubtitles(src);
      return {
        type: mediaType,
        filename: src.name,
        src: src.path,
        subtitles: sub ? sub.map((f) => f.path) : [],
        hash,
        updateTrackInfo,
        getSrcFile,
      };
    }

    // direct links
    const rawFilename = decodeURI(src.pathname).split("/").pop() ?? "";
    return {
      type: mediaType,
      filename: decodeURI(rawFilename),
      src,
      hash: src.hash,
    };
  } else if (src instanceof TFile) return null;

  switch (src.hostname) {
    case "www.bilibili.com":
      if (src.pathname.startsWith("/video")) {
        let videoId = src.pathname.replace("/video/", "");
        let queryStr: string;
        if (/^bv/i.test(videoId)) {
          queryStr = `?bvid=${videoId}`;
        } else if (/^av/i.test(videoId)) {
          videoId = videoId.substring(2);
          queryStr = `?aid=${videoId}`;
        } else {
          console.log(`invaild video id: ${videoId}`);
          return null;
        }
        let page = src.searchParams.get("p");
        if (page) queryStr += `&page=${page}`;
        return {
          host: Host.bili,
          id: videoId,
          src,
          iframe: new URL(
            `https://player.bilibili.com/player.html${queryStr}&high_quality=1&danmaku=0`,
          ),
          hash: src.hash,
        };
      } else {
        console.log("bilibili video url not supported or invalid");
        return null;
      }
      break;
    case "www.youtube.com":
    case "youtu.be":
      if (src.pathname === "/watch") {
        let videoId = src.searchParams.get("v");
        if (videoId) {
          return {
            host: Host.youtube,
            id: videoId,
            iframe: new URL(`https://www.youtube.com/embed/${videoId}`),
            src,
            hash: src.hash,
          };
        } else {
          console.log(`invalid video id: ${src.toString()}`);
          return null;
        }
      } else if (src.host === "youtu.be") {
        if (/^\/[^\/]+$/.test(src.pathname)) {
          let videoId = src.pathname.substring(1);
          return {
            host: Host.youtube,
            id: videoId,
            iframe: new URL(`https://www.youtube.com/embed/${videoId}`),
            src,
            hash: src.hash,
          };
        } else {
          console.log(`invalid video id: ${src.toString()}`);
          return null;
        }
      } else {
        console.log("youtube video url not supported or invalid");
        return null;
      }
      break;
    case "vimeo.com":
      const path = src.pathname;
      let match;
      if ((match = path.match(/^\/(\d+)$/))) {
        let videoId = match[1];
        return {
          host: Host.vimeo,
          id: videoId,
          iframe: new URL(`https://player.vimeo.com/video/${videoId}`),
          src,
          hash: src.hash,
        };
      } else {
        console.log("vimeo video url not supported or invalid");
        return null;
      }
    default:
      return null;
  }
};

/**
 * get links that is safe to use in obsidian
 */
export const getLink = (
  ...args: [info: mediaInfo_Internal, vault: Vault] | [info: mediaInfo_Direct]
): URL => {
  const [info, vault] = args;
  if (isInternal(info)) {
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

    return file ? getVideoInfo(file, hash) : null;
  } else {
    const src = el instanceof HTMLAnchorElement ? el.href : el.getAttr("src");
    if (!src) {
      console.info("fail to get embed src: %o, escaping", el);
      return null;
    } else return getVideoInfo(src);
  }
};

export async function updateTrackInfo(this: mediaInfo_Internal, vault: Vault) {
  if (this.subtitles.length > 0) {
    const track = await getSubtitleTracks(this.subtitles, vault);
    this.trackInfo = track;
    return track;
  } else return null;
}
export function getSrcFile(this: mediaInfo_Internal, vault: Vault) {
  const aFile = vault.getAbstractFileByPath(this.src);
  if (aFile && aFile instanceof TFile) return aFile;
  else throw new Error("src file not found for path: " + this.src);
}
