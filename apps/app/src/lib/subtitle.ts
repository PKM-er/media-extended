import { readdir, readFile } from "fs/promises";
import type { TextTrackInit } from "@vidstack/react";
import type { Vault } from "obsidian";
import { Notice, TFile } from "obsidian";
import type { MediaURL } from "@/web/url-match";
import { groupBy } from "./group-by";
import { format, langCodeToLabel } from "./lang/lang";
import path from "./path";

const supportedFormat = ["vtt", "ass", "ssa", "srt"] as const;
function isCaptionsFile(ext: string): ext is (typeof supportedFormat)[number] {
  return supportedFormat.includes(ext as any);
}

export function getTracks<F extends FileInfo>(
  mediaBasename: string,
  siblings: F[],
  defaultLangCode?: string,
): LocalTrack<F>[] {
  const subtitles = siblings.flatMap((file) => {
    const track = toTrack(file, mediaBasename);
    if (!track) return [];
    return [track];
  });
  const subtitlesByLang = groupBy(subtitles, (v) => v.language);
  const allLanguages = [...subtitlesByLang.keys()];
  const subtitleDefaultLang = !defaultLangCode
    ? allLanguages.filter((l) => !!l)[0]
    : allLanguages.find((code) => {
        // exact match
        if (!code) return;
        return code === defaultLangCode;
      }) ??
      allLanguages.find((code) => {
        // only language match
        if (!code) return;
        const lang = code.split("-")[0],
          defaultLang = defaultLangCode.split("-")[0];
        return lang === defaultLang;
      });

  const uniqueTracks: LocalTrack<F>[] = [];
  subtitlesByLang.forEach((tracks, lang) => {
    for (const fmt of supportedFormat) {
      const track = tracks.find((track) => track.type === fmt);
      if (track) {
        uniqueTracks.push({
          ...track,
          default: !!subtitleDefaultLang && lang === subtitleDefaultLang,
        });
        return;
      }
    }
  });
  if (uniqueTracks.length === 0) {
    return [];
  }
  if (!subtitleDefaultLang) {
    uniqueTracks[0].default = true;
  }
  return uniqueTracks;
}

export async function getTracksLocal(media: MediaURL, defaultLang?: string) {
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
    .map(
      (f): FileInfo => ({
        extension: f.name.split(".").pop()!,
        basename: f.name.split(".").slice(0, -1).join("."),
        path: path.join(parentDir, f.name),
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

  const [fileBasename, lan, ...rest] = file.basename.split(".");
  if (rest.length > 0 || fileBasename !== basename) return null;
  const langCode = format(lan);
  const label = langCode ? langCodeToLabel(langCode) : "Unknown";
  return {
    kind: "subtitles",
    language: langCode ?? undefined,
    id: `${file.basename}.${file.extension}.${langCode ?? "unknown"}`,
    src: file,
    type: file.extension,
    label: `${label} (${file.extension})`,
    default: false,
  };
}
