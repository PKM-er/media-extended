import assertNever from "assert-never";
import type { TFile } from "obsidian";

import {
  DirectLinkInfo,
  HostMediaInfo,
  MediaInfoType,
  MediaType,
  ObsidianMediaInfo,
} from "./defs";

export type HostInfoHandler = (
  src: URL,
) => Omit<HostMediaInfo, "size" | "title"> | null;

import bultiinHostHandlers from "./hosts/index";
function* hostInfoHandlers(addition?: HostInfoHandler[]) {
  yield* bultiinHostHandlers;
  if (addition) yield* addition;
}

export type ObsidianInfoHandler<T extends Omit<ObsidianMediaInfo, "size">> = (
  file: TFile,
  hash: string,
  type: MediaType,
  title?: string,
) => T | null;
/**
 * @param obsidian function to get media info from obsidian file
 */
export const getMediaInfo = async <Ob extends ObsidianMediaInfo>(
  src:
    | { type: "external"; link: URL; title?: string }
    | { type: "internal"; file: TFile; hash: string; title?: string },
  getMediaType: (src: string | URL | { extension: string }) => MediaType | null,
  handlers?: {
    obsidian?: ObsidianInfoHandler<Ob>;
    hosts?: HostInfoHandler[];
  },
): Promise<Ob | DirectLinkInfo | HostMediaInfo | null> => {
  let type: MediaType | null;
  const { title } = src;
  const size = parseSizeSyntax(title) ?? {};
  if (src.type === "external") {
    const { link } = src;
    if ((type = getMediaType(link))) {
      // direct links
      const rawFilename = decodeURI(link.pathname).split("/").pop() ?? "";
      return {
        title,
        size,
        from: MediaInfoType.Direct,
        type,
        filename: rawFilename,
        src: link,
        hash: link.hash,
      };
    } else {
      for (const handler of hostInfoHandlers(handlers?.hosts)) {
        const info = handler(link);
        if (info) return { size, title, ...info };
      }
    }
  } else if (src.type === "internal") {
    if (!handlers?.obsidian) {
      console.error("no obsidian handler registered");
      return null;
    }
    let type;
    if (!(type = getMediaType(src.file))) {
      console.error("given file not supported media", src.file);
      return null;
    }
    return handlers.obsidian(src.file, src.hash, type, title);
  } else {
    assertNever(src);
  }
  return null;
};

const sizeSyntaxAllowedChar = /^[\d\sx]+$/,
  sizeDefPattern = /^\s*(\d+)\s*$/;
export const parseSizeSyntax = (title: string | undefined) => {
  let result: Partial<Record<"x" | "y", number>> = {};
  if (!title || !sizeSyntaxAllowedChar.test(title)) return null;
  let [x, y, ...rest] = title.split("x");
  if (
    rest.length > 0 ||
    (x && !(x = x.match(sizeDefPattern)?.[1]!)) ||
    (y && !(y = y.match(sizeDefPattern)?.[1]!))
  )
    return null;
  if (x) result.x = parseInt(x);
  if (y) result.y = parseInt(y);
  return result;
};
