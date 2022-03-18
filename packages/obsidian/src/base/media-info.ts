import assertNever from "assert-never";
import {
  DirectLinkInfo,
  getMediaInfo as getMediaInfo0,
  HostMediaInfo,
  MediaInfoType,
  MediaType,
  ObsidianMediaInfo,
  parseSizeSyntax,
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
  /** in-vault relative path for media file */
  src: string;
  /** paths for subtitles, could be empty */
  subtitles: string[];
  hash: string;
  trackInfo?: trackInfo;
  title: string | undefined;
  get size() {
    return parseSizeSyntax(this.title) ?? {};
  }
  public get resourcePath() {
    return this.vault.getResourcePath(this.getSrcFile());
  }
  public get resourcePathWithHash() {
    return this.vault.getResourcePath(this.getSrcFile()) + this.hash;
  }

  private get vault(): Vault {
    return this.app.vault;
  }
  constructor(
    fileOrInfo:
      | [file: TFile, hash: string, type: MediaType, title?: string]
      | ObsidianMediaInfo,
    public app: App,
  ) {
    if (isObsidianMediaInfo(fileOrInfo)) {
      this.type = fileOrInfo.type;
      this.filename = fileOrInfo.filename;
      this.src = fileOrInfo.src;
      this.subtitles = fileOrInfo.subtitles;
      this.hash = fileOrInfo.hash;
      this.title = fileOrInfo.title;
    } else {
      const [file, hash, type, title] = fileOrInfo;
      this.type = type;
      this.filename = file.name;
      this.src = file.path;
      this.subtitles = getSubtitles(file).map((f) => f.path);
      this.hash = hash.startsWith("#") ? hash : `#${hash}`;
      this.title = title;
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
    const json: Omit<ObsidianMediaInfo, "size"> = {
      from: this.from,
      src: this.src,
      type: this.type,
      filename: this.src,
      subtitles: this.subtitles,
      hash: this.hash,
      title: this.title,
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
  src:
    | {
        type: "external";
        link: string;
        title?: string | undefined;
      }
    | {
        type: "internal";
        file: TFile;
        hash: string;
        title?: string | undefined;
      },
  app: App,
) => {
  let source: Parameters<typeof getMediaInfo0>[0];
  if (src.type === "external") {
    let link;
    try {
      link = await getBiliFullLink(new URL(src.link));
    } catch (error) {
      return null;
    }
    source = { ...src, link };
  } else if (src.type === "internal") {
    source = src;
  } else assertNever(src);
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
    title?: string;
    /** media file path */
    file?: TFile;
  },
  app: App,
) => {
  let { linktext, sourcePath, file, title } = info;
  let result = getMediaFileHashFromLinktext(linktext, sourcePath, app, file);
  if (!result) return null;
  return getMediaInfo(
    { type: "internal", title, ...result },
    app,
  ) as Promise<InternalMediaInfo | null>;
};

export const getMediaFileHashFromLinktext = (
  linktext: string,
  /** path of note that holds the link */
  sourcePath: string,
  app: App,
  /** media file path */
  file?: TFile,
) => {
  let { path, subpath: hash } = parseLinktext(linktext);
  if (!file) {
    let media = app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (!media || !(media instanceof TFile)) return null;
    file = media;
  }
  return { file, hash };
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
