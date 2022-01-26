import { getMediaType, MediaType } from "./media-type";

export enum MediaInfoType {
  /** internal file inside obsidian vault */
  Obsidian,
  /** direct link to media file */
  Direct,
  /** media hosted in media platform */
  Host,
}

interface MediaInfoBase {
  from: MediaInfoType;
  src: string | URL;
  /** starts with "#" */
  hash: string;
}

export interface ObsidianMediaInfo extends MediaInfoBase {
  from: MediaInfoType.Obsidian;
  type: MediaType;
  filename: string;
  /** relative path for media file */
  src: string;
  /** paths for subtitles, could be empty */
  subtitles: string[];
}

export interface DirectLinkInfo extends MediaInfoBase {
  from: MediaInfoType.Direct;
  src: URL;
  type: MediaType;
  filename: string;
}

export interface HostMediaInfo extends MediaInfoBase {
  from: MediaInfoType.Host;
  src: URL;
  host: string;
  id: string;
  iframe?: URL;
}

import type { TFile } from "obsidian";

export type HostInfoHandler = (src: URL) => HostMediaInfo | null;
import bultiinHostHandlers from "../hosts/index";
function* hostInfoHandlers(addition?: HostInfoHandler[]) {
  yield* bultiinHostHandlers;
  if (addition) yield* addition;
}

/**
 * @param obsidian function to get media info from obsidian file
 */
export const getMediaInfo = async <Ob extends ObsidianMediaInfo>(
  src: URL | { file: TFile; hash: string },
  handlers?: {
    obsidian?: (file: TFile, hash: string, type: MediaType) => Ob | null;
    hosts?: HostInfoHandler[];
  },
): Promise<Ob | DirectLinkInfo | HostMediaInfo | null> => {
  let type: MediaType | null;
  if (src instanceof URL) {
    if ((type = getMediaType(src))) {
      // direct links
      const rawFilename = decodeURI(src.pathname).split("/").pop() ?? "";
      return {
        from: MediaInfoType.Direct,
        type,
        filename: rawFilename,
        src: src,
        hash: src.hash,
      };
    } else {
      for (const handler of hostInfoHandlers(handlers?.hosts)) {
        const info = handler(src);
        if (info) return info;
      }
    }
  } else if (handlers?.obsidian && (type = getMediaType(src.file))) {
    return handlers?.obsidian(src.file, src.hash, type);
  }
  return null;
};
