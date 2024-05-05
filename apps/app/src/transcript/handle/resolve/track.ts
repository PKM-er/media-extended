import { TFile } from "obsidian";
import type { MediaURL } from "@/info/media-url";
import { getCaptionExts, toTrack, type LocalTrack } from "@/info/track-info";
import { groupBy } from "@/lib/group-by";
import type { FileInfo } from "@/lib/iter-sibling";
import { iterSiblings } from "@/lib/iter-sibling";
import path from "@/lib/path";

function dedupeTracks<F extends FileInfo>(tracks: LocalTrack<F>[]) {
  return [...groupBy(tracks, (v) => v.language).values()].reduce<
    LocalTrack<F>[]
  >((final, tracks) => {
    // find the first supported format
    const preferred = getCaptionExts().reduce<LocalTrack<F> | undefined>(
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
}

export async function resolveLocalTracks(media: MediaURL) {
  const filePath = media.filePath;
  if (!filePath || !media.inferredType) return [];
  const mediaName = path.basename(filePath);
  const mediaBaseame = mediaName.split(".").slice(0, -1).join(".");
  const parentDir = path.dirname(filePath);

  try {
    const tracks: LocalTrack<FileInfo>[] = [];
    for await (const file of iterSiblings(parentDir, [mediaName])) {
      const track = toTrack(file);
      if (!track || track.basename !== mediaBaseame) continue;
      tracks.push(track);
    }

    return dedupeTracks(tracks);
  } catch (e) {
    console.error(`Failed to resolve local tracks for ${filePath}`, e);
    return [];
  }
}

export async function resolveInvaultTracks(media: TFile) {
  if (!media.parent) return [];

  let track;
  const tracks = media.parent.children
    .map((f) =>
      f instanceof TFile &&
      (track = toTrack(f)) &&
      track.basename === media.basename
        ? track
        : null,
    )
    .filter((t): t is LocalTrack<TFile> => !!t);

  return dedupeTracks(tracks);
}
