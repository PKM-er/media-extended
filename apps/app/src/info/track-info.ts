import { fileURLToPath } from "url";
import type { ParsedCaptionsResult } from "media-captions";
import { TFile } from "obsidian";
import { toFileInfo, type FileInfo } from "@/lib/file-info";
import { format } from "@/lib/lang/lang";
import { noHash, toURL } from "@/lib/url";

const allowedProtocols = new Set(["https:", "http:", "file:"]);

export type TextTrackKind = "captions" | "subtitles";
export const textTrackFmField = {
  subtitles: {
    singular: "subtitle",
    plural: "subtitles",
  },
  captions: {
    singular: "caption",
    plural: "captions",
  },
} as const;
export const textTrackKinds = Object.keys(
  textTrackFmField,
) as (keyof typeof textTrackFmField)[];

/**
 * for those extracted from web, provide a unique id from web provider
 */
export const trackWebsiteIDKey = "wid" as const;
interface TextTrackInfoBase {
  wid?: string;
  type?: SupportedCaptionExt;
  language?: string;
  label?: string;
  content?: string | ParsedCaptionsResult;
  kind: TextTrackKind;
}
export type WebsiteTextTrack = TextTrackInfoBase & { wid: string };
export interface LocalTrack<F extends FileInfo> extends TextTrackInfoBase {
  basename: string;
  type: SupportedCaptionExt;
  src: F;
}
export interface RemoteTrack extends TextTrackInfoBase {
  type: SupportedCaptionExt;
  src: URL;
}

export type LoadedTextTrack = TextTrackInfo & {
  content: string;
};
export type ParsedTextTrack = TextTrackInfo & {
  content: ParsedCaptionsResult;
};

export type TextTrackInfo = RemoteTrack | LocalTrack<FileInfo>;

interface TrackURLOptions {
  kind?: TextTrackKind;
}

export function parseTrackUrl(
  _url: string | URL,
  opts: TrackURLOptions = {},
): RemoteTrack | LocalTrack<FileInfo> | null {
  const url = toURL(_url);
  if (!url || !allowedProtocols.has(url.protocol)) return null;
  if (url.protocol === "file:") {
    try {
      const filepath = fileURLToPath(url);
      const track = toTrack(toFileInfo(filepath), {
        kind: opts.kind,
        subpath: url.hash,
      });
      if (!track) return null;
      return track;
    } catch (e) {
      console.error("Failed to resolve file path", e, url.href);
      return null;
    }
  }
  try {
    return parseURL(url, opts);
  } catch (e) {
    console.error("Invalid track URL", e, url.href);
    return null;
  }
}

function parseHash(hash: string): Partial<TextTrackInfoBase> {
  const query = new URLSearchParams(hash.replace(/^#/, ""));
  let format = query.get("type") ?? undefined;
  if (!format || !isSupportedCaptionExt(format)) {
    format = undefined;
  }
  let kind = query.get("kind") ?? undefined;
  if (kind !== "captions" && kind !== "subtitles") {
    kind = undefined;
  }

  return {
    language: query.get("lang") ?? undefined,
    label: query.get("label") ?? undefined,
    type: format,
    kind,
    wid: query.get(trackWebsiteIDKey) ?? undefined,
  };
}

function parseURL(
  src: URL,
  { kind: fallbackKind }: TrackURLOptions,
): RemoteTrack {
  const fromHash = parseHash(src.hash);
  const { wid, kind = fallbackKind ?? "subtitles", label } = fromHash;
  let { language, type } = fromHash;

  // parse as a file
  const { basename, extension } = toFileInfo(src.pathname, "/");
  if (isSupportedCaptionExt(extension)) {
    const { language: lang } = parseTrackFromBasename(basename);
    if (lang) language ??= lang;
    type ??= extension;
    return { wid, language, label, type, kind, src };
  }
  if (!type) {
    throw new Error(
      "Cannot infer format from URL, provide format in hash: " + src.href,
    );
  }
  return { wid, language, label, type, kind, src };
}

export function parseTrackFromBasename(basename: string): {
  basename: string;
  language: string | null;
} {
  // for video file "hello.mp4"
  // vaild subtitle:
  // - "./hello.en.srt", "./hello.zh.srt" (muiltple files)
  // - "./hello.srt" (single file)
  const segments = basename.split(".");
  // if no . within basename, skip langcode parsing
  const language = segments.length > 1 ? format(segments.last()!) : null;
  return {
    basename: language
      ? basename.replace(new RegExp(`\\.?${segments.last()!}$`), "")
      : basename,
    language,
  };
}

const supportedCaptionExts = ["vtt", "srt", "ass", "ssa"] as const;
const checkerSet = new Set(supportedCaptionExts);
export const getCaptionExts = () => [...supportedCaptionExts];
export type SupportedCaptionExt = (typeof supportedCaptionExts)[number];
export function isSupportedCaptionExt(ext: string): ext is SupportedCaptionExt {
  return checkerSet.has(ext);
}
export function isCaptionFile<T extends FileInfo>(
  file: T,
): file is T & { extension: SupportedCaptionExt } {
  return isSupportedCaptionExt(file.extension);
}

export function toTrack<F extends FileInfo>(
  trackFile: F,
  {
    kind = "subtitles",
    subpath = "",
    alias,
  }: Partial<{
    kind: TextTrackKind;
    subpath: string;
    alias: string;
  }> = {},
): LocalTrack<F> | null {
  if (!isCaptionFile(trackFile)) return null;
  const { basename, language } = parseTrackFromBasename(trackFile.basename);
  const fromHash = parseHash(subpath);
  return {
    wid: fromHash.wid,
    kind: fromHash.kind ?? kind,
    basename,
    label: alias ?? fromHash.label,
    language: fromHash.language ?? language ?? undefined,
    src: trackFile,
    type: fromHash.type ?? trackFile.extension,
  };
}

export function getTrackInfoID({ wid, src }: TextTrackInfo) {
  const type =
    src instanceof URL ? "url" : src instanceof TFile ? "file" : "file-url";
  const srcURL = src instanceof URL ? noHash(src) : src.path;
  return { id: `${type}:${srcURL}`, wid };
}

export function isVaultTrack(trackID: string) {
  return trackID.startsWith("file:");
}
