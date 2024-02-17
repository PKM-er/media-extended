import { readdir, readFile } from "fs/promises";
import { basename, dirname, join } from "path";
import type { TextTrackInit } from "@vidstack/react";
import iso from "iso-639-1";
import type { Vault } from "obsidian";
import { Notice, TFile } from "obsidian";
import type { MediaURL } from "@/web/url-match";

const supportedFormat = ["vtt", "ass", "ssa", "srt"] as const;
function isCaptionsFile(ext: string): ext is (typeof supportedFormat)[number] {
  return supportedFormat.includes(ext as any);
}

export function getTracks<F extends FileInfo>(
  mediaBasename: string,
  siblings: F[],
  defaultLang?: string,
): LocalTrack<F>[] {
  const subtitles = siblings.flatMap((file) => {
    const track = toTrack(file, mediaBasename);
    if (!track) return [];
    return [track];
  });
  const byLang = groupBy(subtitles, (v) => v.language);
  const uniqueTracks: LocalTrack<F>[] = [];
  const hasDefaultLang = byLang.has(defaultLang);
  byLang.forEach((tracks, lang) => {
    for (const fmt of supportedFormat) {
      const track = tracks.find((track) => track.type === fmt);
      if (track) {
        uniqueTracks.push({
          ...track,
          default: lang === defaultLang,
        });
        return;
      }
    }
  });
  if (uniqueTracks.length === 0) {
    return [];
  }
  if (!hasDefaultLang) {
    uniqueTracks[0].default = true;
  }
  return uniqueTracks;
}

export async function getTracksLocal(media: MediaURL, defaultLang?: string) {
  const filePath = media.filePath;
  if (!filePath || !media.inferredType) return [];
  const mediaName = basename(filePath);
  const mediaBaseame = mediaName.split(".").slice(0, -1).join(".");
  const parentDir = dirname(filePath);

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
    .map(
      (f): FileInfo => ({
        extension: f.name.split(".").pop()!,
        basename: f.name.split(".").slice(0, -1).join("."),
        path: join(parentDir, f.name),
      }),
    );

  const uniqueTracks = getTracks(mediaBaseame, siblings, defaultLang);

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
  defaultLang?: string,
) {
  const { basename: videoName, parent: folder } = media;
  if (!folder) return [];

  const uniqueTracks = getTracks(
    videoName,
    folder.children.filter((f): f is TFile => f instanceof TFile),
    defaultLang,
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

function groupBy<T, K>(array: T[], getKey: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of array) {
    const key = getKey(item);
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
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
  file: F,
  basename: string,
): LocalTrack<F> | null {
  if (!isCaptionsFile(file.extension)) return null;

  // for video file "hello.mp4"
  // vaild subtitle:
  // - "./hello.en.srt", "./hello.zh.srt" (muiltple files)
  // - "./hello.srt" (single file)

  if (file.basename === basename) {
    return {
      kind: "subtitles",
      src: file,
      id: `${file.basename}.${file.extension}.unknown`,
      type: file.extension,
      label: "Unknown",
      default: false,
    };
  }
  const [fileBasename, language, ...rest] = file.basename.split(".");
  if (fileBasename !== basename || rest.length > 0 || !iso.validate(language))
    return null;
  return {
    kind: "subtitles",
    language,
    id: `${file.basename}.${file.extension}.${language}`,
    src: file,
    type: file.extension,
    label: iso.getNativeName(language) || language,
    default: false,
  };
}
