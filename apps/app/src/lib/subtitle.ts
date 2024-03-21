import { readdir, readFile } from "fs/promises";
import type { TextTrackInit } from "@vidstack/react";
import type { Vault } from "obsidian";
import { Notice, TFile } from "obsidian";
import type { MediaURL } from "@/info/media-url";
import { groupBy } from "./group-by";
import { format, langCodeToLabel } from "./lang/lang";
import path from "./path";

const supportedFormat = ["vtt", "ass", "ssa", "srt"] as const;
type SupportedSubtitleFormat = (typeof supportedFormat)[number];
function isCaptionsFile<T extends FileInfo>(
  file: T,
): file is T & { extension: SupportedSubtitleFormat } {
  return supportedFormat.includes(file.extension);
}

export function getTracks<F extends FileInfo>(
  media: Omit<F, "extension">,
  siblings: F[],
): LocalTrack<F>[] {
  console.debug("Search subtitles for media", {
    basename: media.basename,
    path: media.path,
  });
  console.debug(`${siblings.length} siblings`, siblings);
  const subtitles = siblings.filter(isCaptionsFile).flatMap((file) => {
    const track = toTrack(file, media.basename);
    if (!track) return [];
    return [track];
  });
  if (subtitles.length === 0) {
    console.debug("No subtitles found");
    return subtitles;
  }
  console.debug(
    `Found ${subtitles.length} subtitles: `,
    subtitles.map((f) => f.src.path),
  );
  console.debug(`Subtitles details: `, subtitles);
  // const subtitlesByLang = ;
  const filteredTracks = [
    ...groupBy(subtitles, (v) => v.language).values(),
  ].reduce<LocalTrack<F>[]>((final, tracks) => {
    // find the first supported format
    const preferred = supportedFormat.reduce<LocalTrack<F> | undefined>(
      (out, format) => {
        if (out) return out;
        return tracks.find((t) => t.type === format);
      },
      void 0,
    );
    if (preferred) {
      final.push(preferred);
    }
    return final;
  }, []);
  console.debug(
    `Final tracks: ${filteredTracks.length}`,
    filteredTracks.map((f) => f.src.path),
  );
  console.debug(`Final tracks details`, filteredTracks);
  return filteredTracks;
}

export async function getTracksLocal(media: MediaURL) {
  const filePath = media.filePath;
  if (!filePath || !media.inferredType) return [];
  const mediaName = path.basename(filePath);
  const mediaBaseame = mediaName.split(".").slice(0, -1).join(".");
  const parentDir = path.dirname(filePath);

  const siblings = (
    await readdir(parentDir, {
      encoding: "utf-8",
      withFileTypes: true,
    }).catch((e) => {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== "ENOENT")
        new Notice(`Failed to read directory ${parentDir}: ${err.message}`);
      return [];
    })
  )
    .filter((f) => f.name !== mediaName && (f.isFile() || f.isSymbolicLink()))
    .map((f): FileInfo => {
      const segs = f.name.split(".");
      if (segs.length === 1)
        return {
          extension: "",
          basename: f.name,
          path: path.join(parentDir, f.name),
        };

      return {
        extension: segs.at(-1)!,
        basename: segs.slice(0, -1).join("."),
        path: path.join(parentDir, f.name),
      };
    });

  const uniqueTracks = getTracks(
    { basename: mediaBaseame, path: filePath },
    siblings,
    // defaultLang,
  );

  return (
    await Promise.all(
      uniqueTracks.map(async ({ src, ...t }): Promise<TextTrackInit | null> => {
        const content = await readFile(src.path, "utf-8").catch((e) => {
          const err = e as NodeJS.ErrnoException;
          if (err.code !== "ENOENT") {
            new Notice(
              `Failed to read subtitle file ${src.path}: ${err.message}`,
            );
          }
          return "";
        });
        if (!content) return null;
        return { ...t, content };
      }),
    )
  ).filter((t): t is TextTrackInit => !!t);
}

export async function getTracksInVault(
  media: TFile,
  vault: Vault,
  // defaultLang?: string,
) {
  if (!media.parent) return [];

  const uniqueTracks = getTracks(
    media,
    media.parent.children.filter((f): f is TFile => f instanceof TFile),
    // defaultLang,
  );

  return await Promise.all(
    uniqueTracks.map(
      async ({ src, ...t }) =>
        ({
          ...t,
          content: await vault.cachedRead(src),
        } satisfies TextTrackInit),
    ),
  );
}

interface LocalTrack<F extends FileInfo> {
  id: string;
  kind: "subtitles";
  language?: string;
  src: F;
  type: "vtt" | "ass" | "ssa" | "srt";
  label: string;
  default: boolean;
}

interface FileInfo {
  extension: string;
  basename: string;
  path: string;
}

function toTrack<F extends FileInfo>(
  trackFile: F & { extension: SupportedSubtitleFormat },
  basename: string,
): LocalTrack<F> | null {
  // for video file "hello.mp4"
  // vaild subtitle:
  // - "./hello.en.srt", "./hello.zh.srt" (muiltple files)
  // - "./hello.srt" (single file)

  if (!trackFile.basename.startsWith(basename)) return null;

  const suffix = trackFile.basename.substring(basename.length);

  let langCode: string | null;
  if (!suffix) {
    // exact match without lang code
    langCode = null;
  } else {
    langCode = format(suffix.replace(/^\./, ""));
    if (!langCode) return null;
  }

  const label = langCode ? langCodeToLabel(langCode) : "Unknown";
  return {
    kind: "subtitles",
    language: langCode ?? undefined,
    id: `${trackFile.basename}.${trackFile.extension}.${langCode ?? "unknown"}`,
    src: trackFile,
    type: trackFile.extension,
    label: `${label} (${trackFile.extension})`,
    default: false,
  };
}
