import type { TFile } from "obsidian";

import {
  DirectLinkInfo,
  HostMediaInfo,
  MediaInfoType,
  MediaType,
  ObsidianMediaInfo,
} from "./defs";
import { getMediaType } from "./media-type";

export type HostInfoHandler = (src: URL) => HostMediaInfo | null;

import bultiinHostHandlers from "./hosts/index";
function* hostInfoHandlers(addition?: HostInfoHandler[]) {
  yield* bultiinHostHandlers;
  if (addition) yield* addition;
}

export type ObsidianInfoHandler<T extends ObsidianMediaInfo> = (
  file: TFile,
  hash: string,
  type: MediaType,
) => T | null;
/**
 * @param obsidian function to get media info from obsidian file
 */
export const getMediaInfo = async <Ob extends ObsidianMediaInfo>(
  src: URL | { file: TFile; hash: string },
  handlers?: {
    obsidian?: ObsidianInfoHandler<Ob>;
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
