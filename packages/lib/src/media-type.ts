import { MediaType } from "./defs";

export const ExtensionAccepted: Map<MediaType, string[]> = new Map([
  [MediaType.Audio, ["mp3", "wav", "m4a", "ogg", "3gp", "flac"]],
  [MediaType.Video, ["mp4", "ogv"]],
  [MediaType.Unknown, ["webm"]],
]);

const isFile = (src: any): src is { extension: string } =>
  typeof src?.extension === "string" && src.extension.length > 0;

export const getMediaType = (
  src: string | URL | { extension: string },
): MediaType | null => {
  // if url contains no extension, type = null
  let ext: string | null = null;
  if (isFile(src)) {
    ext = src.extension;
  } else {
    const path = getPath(src, checkVercelIndex);
    if (path) {
      ext = path.split(".").pop() as string;
    }
  }
  if (!ext) return null;

  let fileType: MediaType | null = null;
  for (const [type, extList] of ExtensionAccepted) {
    if (extList.includes(ext)) fileType = type;
  }
  return fileType;
};

import { parse as parseQS, ParsedQuery } from "query-string";
import url from "url-parse";
const urlExtPattern = /\.[^/]+?$/;
type parsedUrl = url<string> & { query: ParsedQuery<string> };
const getPath = (
  src: URL | string,
  ...tests: ((url: parsedUrl) => string | null)[]
): string | null => {
  const parsed = url(src.toString(), parseQS) as parsedUrl;
  if (urlExtPattern.test(parsed.pathname)) return parsed.pathname;
  else
    for (const test of tests) {
      const path = test(parsed);
      if (path) return path;
    }
  return null;
};

/** support onedrive-vercel-index */
const checkVercelIndex = (parsed: parsedUrl) => {
  const { pathname, query } = parsed;
  if (
    // support onedrive-vercel-index
    pathname === "/api" &&
    query.raw === "true" &&
    typeof query.path === "string" &&
    urlExtPattern.test(query.path)
  )
    return query.path;
  else return null;
};
