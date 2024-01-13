import type { TextTrackInit } from "@vidstack/react";
import iso from "iso-639-1";
import type { Vault } from "obsidian";
import { TFile } from "obsidian";

const supportedFormat = ["vtt", "ass", "ssa", "srt"] as const;
function isCaptionsFile(ext: string): ext is (typeof supportedFormat)[number] {
  return supportedFormat.includes(ext as any);
}

export async function getTracks(
  media: TFile,
  vault: Vault,
  defaultLang?: string,
) {
  const { basename: videoName, parent: folder } = media;
  if (!folder) return [];

  const subtitles = folder.children.flatMap((file) => {
    // filter file only (exclude folder)
    if (!(file instanceof TFile)) return [];
    const track = toTrack(file, videoName);
    if (!track) return [];
    return [track];
  });

  const byLang = groupBy(subtitles, (v) => v.language);
  const uniqueTracks: LocalTrack[] = [];
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

interface LocalTrack {
  id: string;
  kind: "subtitles";
  language?: string;
  src: TFile;
  type: "vtt" | "ass" | "ssa" | "srt";
  label: string;
  default: boolean;
}

function toTrack(file: TFile, basename: string): LocalTrack | null {
  if (!isCaptionsFile(file.extension)) return null;

  // for video file "hello.mp4"
  // vaild subtitle:
  // - "./hello.en.srt", "./hello.zh.srt" (muiltple files)
  // - "./hello.srt" (single file)

  if (file.basename === basename) {
    return {
      kind: "subtitles",
      src: file,
      id: `${file.name}.unknown`,
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
    id: `${file.name}.${language}`,
    src: file,
    type: file.extension,
    label: iso.getNativeName(language) || language,
    default: false,
  };
}
