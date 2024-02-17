import { readdir, readFile } from "fs/promises";
import { basename, dirname, join } from "path";
import type { TextTrackInit } from "@vidstack/react";
import tag, { type Tag } from "language-tags";
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
  const defaultLangTag = defaultLang ? tag(defaultLang) : undefined;
  const subtitlesByLang = groupBy(subtitles, (v) => v.language);
  const allLanguages = [...subtitlesByLang.keys()].map((t) =>
    t ? tag(t) : undefined,
  );
  const subtitleDefaultLang = !defaultLang
    ? allLanguages.filter((l) => !!l)[0]
    : allLanguages.find((tag) => {
        // exact match
        if (!tag) return;
        return tag.format() === defaultLangTag?.format();
      }) ??
      allLanguages.find((tag) => {
        // script or region code match
        if (!tag) return;
        const lang = tag.language();
        const langDefault = defaultLangTag?.language();
        if (!lang || !langDefault || lang.format() !== langDefault.format())
          return false;
        const script = tag.script(),
          scriptDefault = defaultLangTag?.script();
        const region = tag.region(),
          regionDefault = defaultLangTag?.region();
        if (lang.format() === "zh") {
          if (scriptDefault?.format() === "Hans") {
            return (
              script?.format() === "Hans" ||
              region?.format() === "CN" ||
              region?.format() === "SG"
            );
          } else if (scriptDefault?.format() === "Hant") {
            return (
              script?.format() === "Hant" ||
              region?.format() === "TW" ||
              region?.format() === "HK" ||
              region?.format() === "MO"
            );
          }
        }
        return (
          (script &&
            scriptDefault &&
            script.format() === scriptDefault.format()) ||
          (region &&
            regionDefault &&
            region.format() === regionDefault.format())
        );
      }) ??
      allLanguages.find((tag) => {
        // only language match
        if (!tag) return;
        const lang = tag.language();
        if (!lang) return;
        return lang.format() === defaultLangTag!.language()?.format();
      });

  const uniqueTracks: LocalTrack<F>[] = [];
  subtitlesByLang.forEach((tracks, lang) => {
    for (const fmt of supportedFormat) {
      const track = tracks.find((track) => track.type === fmt);
      if (track) {
        uniqueTracks.push({
          ...track,
          default:
            !!subtitleDefaultLang && lang === subtitleDefaultLang.format(),
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
  if (fileBasename !== basename || rest.length > 0 || !tag.check(language))
    return null;

  const langTag = tag(language);
  return {
    kind: "subtitles",
    language: langTag.format(),
    id: `${file.basename}.${file.extension}.${language}`,
    src: file,
    type: file.extension,
    label: langTagToLabel(langTag, file.extension),
    default: false,
  };
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export function langTagToLabel(lang: Tag, comment: string) {
  const primaryDesc = lang.descriptions()[0];
  if (primaryDesc) return `${primaryDesc} (${comment})`;
  const langDesc = lang.language()?.descriptions()[0];
  const scriptDesc = lang.script()?.descriptions()[0];
  const regionDesc = lang.region()?.descriptions()[0];
  if (!langDesc) return `${lang.format()} (${comment})`;
  if (!scriptDesc && !regionDesc) return langDesc;
  return `${langDesc} (${scriptDesc || regionDesc}, ${comment})`;
}
