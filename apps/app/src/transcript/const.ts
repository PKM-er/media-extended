import { format, langCodeToLabel } from "@/lib/lang/lang";

export const localTranscriptViewType = "mx-transcript-local";

export const supportedCaptionExts = ["vtt", "srt", "ass", "ssa"] as const;
export type SupportedCaptionExt = (typeof supportedCaptionExts)[number];
export function isSupportedCaptionExt(ext: string): ext is SupportedCaptionExt {
  return supportedCaptionExts.includes(ext);
}

export function isCaptionFile<T extends FileInfo>(
  file: T,
): file is T & { extension: SupportedCaptionExt } {
  return isSupportedCaptionExt(file.extension);
}

export interface FileInfo {
  extension: string;
  basename: string;
  path: string;
}

export interface LocalTrack<F extends FileInfo> {
  id: string;
  kind: "subtitles";
  basename: string;
  language?: string;
  src: F;
  type: "vtt" | "ass" | "ssa" | "srt";
  label: string;
  default: boolean;
}

export function toTrack<F extends FileInfo>(
  trackFile: F & { extension: SupportedCaptionExt },
): LocalTrack<F> {
  // for video file "hello.mp4"
  // vaild subtitle:
  // - "./hello.en.srt", "./hello.zh.srt" (muiltple files)
  // - "./hello.srt" (single file)

  const segments = trackFile.basename.split(".");
  // if no . within basename, skip langcode parsing
  const langCode = segments.length > 1 ? format(segments.last()!) : null;
  const label = langCode ? langCodeToLabel(langCode) : "Unknown";

  return {
    kind: "subtitles",
    basename: langCode
      ? trackFile.basename.replace(new RegExp(`\\.?${segments.last()!}$`), "")
      : trackFile.basename,
    language: langCode ?? undefined,
    id: `${trackFile.basename}.${trackFile.extension}.${langCode ?? "unknown"}`,
    src: trackFile,
    type: trackFile.extension,
    label: `${label} (${trackFile.extension})`,
    default: false,
  };
}
