import { readdir, readFile } from "fs/promises";
import type { TextTrackInit } from "@vidstack/react";
import type { Vault } from "obsidian";
import { Notice, TFile } from "obsidian";
import type { MediaURL } from "@/info/media-url";
import {
  isCaptionFile,
  supportedCaptionExts,
  toTrack,
} from "@/transcript/const";
import type { LocalTrack, FileInfo } from "@/transcript/const";
import { groupBy } from "./group-by";
import path from "./path";

export function getTracks<F extends FileInfo>(
  media: Omit<F, "extension">,
  siblings: F[],
): LocalTrack<F>[] {
  console.debug("Search subtitles for media", {
    basename: media.basename,
    path: media.path,
  });
  console.debug(`${siblings.length} siblings`, siblings);
  const subtitles = siblings.filter(isCaptionFile).flatMap((file) => {
    const track = toTrack(file);
    if (track.basename !== media.basename) return [];
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
    const preferred = supportedCaptionExts.reduce<LocalTrack<F> | undefined>(
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
