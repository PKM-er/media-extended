import {
  DirectLinkInfo,
  getMediaInfo as getMediaInfo0,
  HostMediaInfo,
  MediaInfoType,
  MediaType,
  ObsidianMediaInfo,
} from "mx-lib";
import { App, parseLinktext, Platform, TFile, Vault } from "obsidian";

import { getSubtitles, trackInfo } from "../feature/subtitle";
import { getSubtitleTracks } from "../feature/subtitle";
import { getBiliRedirectUrl } from "../misc";
import { getMediaType } from "./media-type";
interface InternalMediaInfoInterface extends ObsidianMediaInfo {
  resourcePath: string;
  trackInfo?: trackInfo;
  updateTrackInfo(vault: Vault): Promise<trackInfo | null>;
  getSrcFile(vault: Vault): TFile;
}

export const isObsidianMediaInfo = (info: any): info is ObsidianMediaInfo =>
  (info as ObsidianMediaInfo)?.from === MediaInfoType.Obsidian;
export class InternalMediaInfo implements InternalMediaInfoInterface {
  from = MediaInfoType.Obsidian as const;
  type: MediaType;
  filename: string;
  /** relative path for media file */
  src: string;
  /** paths for subtitles, could be empty */
  subtitles: string[];
  hash: string;
  trackInfo?: trackInfo;
  public get resourcePath() {
    return this.vault.getResourcePath(this.getSrcFile()) + this.hash;
  }

  private get vault(): Vault {
    return this.app.vault;
  }
  constructor(
    fileOrInfo:
      | [file: TFile, hash: string, type: MediaType]
      | ObsidianMediaInfo,
    public app: App,
  ) {
    if (isObsidianMediaInfo(fileOrInfo)) {
      this.type = fileOrInfo.type;
      this.filename = fileOrInfo.filename;
      this.src = fileOrInfo.src;
      this.subtitles = fileOrInfo.subtitles;
      this.hash = fileOrInfo.hash;
    } else {
      const [file, hash, type] = fileOrInfo;
      this.type = type;
      this.filename = file.name;
      this.src = file.path;
      this.subtitles = getSubtitles(file).map((f) => f.path);
      this.hash = hash.startsWith("#") ? hash : `#${hash}`;
    }
  }
  async updateTrackInfo(): Promise<trackInfo | null> {
    if (this.subtitles.length > 0) {
      const track = await getSubtitleTracks(this.subtitles, this.vault);
      this.trackInfo = track;
      return track;
    } else return null;
  }
  getSrcFile(): TFile {
    const aFile = this.vault.getAbstractFileByPath(this.src);
    if (aFile && aFile instanceof TFile) return aFile;
    else throw new Error("src file not found for path: " + this.src);
  }
  toJSON() {
    const json: ObsidianMediaInfo = {
      from: this.from,
      src: this.src,
      type: this.type,
      filename: this.src,
      subtitles: this.subtitles,
      hash: this.hash,
    };
    return json;
  }
}
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
  app: App,
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
  return getMediaInfo0(source, getMediaType, {
    obsidian: (file, hash, type) => {
      return new InternalMediaInfo([file, hash, type], app);
    },
  });
};
export const getInternalMediaInfo = async (
  info: {
    linktext: string;
    /** path of note that holds the link */
    sourcePath: string;
    /** media file path */
    file?: TFile;
  },
  app: App,
) => {
  let { linktext, sourcePath, file } = info;
  let { path, subpath: hash } = parseLinktext(linktext);
  if (!file) {
    let media = app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (!media || !(media instanceof TFile)) return null;
    file = media;
  }
  return getMediaInfo({ file, hash }, app) as Promise<InternalMediaInfo | null>;
};

/**
 * get links that is safe to use in obsidian
 */
export const getLink = (info: DirectLinkInfo): URL => {
  const { src } = info;
  if (src.protocol === "file:")
    return new URL(src.href.replace(/^file:\/\/\//, "app://local/"));
  else return src;
};
