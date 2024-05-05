import { TFile } from "obsidian";
import type { SupportedMediaExt } from "@/info/media-type";
import { isMediaFile, mediaExtensions } from "@/info/media-type";
import type { LocalTrack } from "@/info/track-info";
import type { FileInfo } from "@/lib/iter-sibling";
import { iterSiblings } from "@/lib/iter-sibling";
import path from "@/lib/path";

function resolveMedia<F extends FileInfo>(
  mediaFiles: (F & { extension: SupportedMediaExt })[],
) {
  for (const ext of mediaExtensions) {
    const media = mediaFiles.find((f) => f.extension === ext);
    if (media) return media;
  }
  return null;
}

export async function resolveLocalMediaForTrack(track: LocalTrack<FileInfo>) {
  const filePath = track.src.path;
  const parentDir = path.dirname(filePath);

  try {
    const mediaFiles = [];
    for await (const file of iterSiblings(parentDir, [
      path.basename(filePath),
    ])) {
      if (file.basename !== track.basename || !isMediaFile(file.extension)) {
        continue;
      }
      mediaFiles.push(file as FileInfo & { extension: SupportedMediaExt });
    }
    return resolveMedia(mediaFiles);
  } catch (e) {
    console.error(`Failed to resolve local media for ${filePath}`, e);
    return null;
  }
}

export async function resolveInvaultMediaForTrack(track: LocalTrack<TFile>) {
  const parentDir = track.src.parent;
  if (!parentDir) return null;

  const mediaFiles = parentDir.children
    .map((f) =>
      f instanceof TFile &&
      f.name !== track.src.name &&
      f.basename === track.basename &&
      isMediaFile(f.extension)
        ? (f as TFile & { extension: SupportedMediaExt })
        : null,
    )
    .filter((f): f is TFile & { extension: SupportedMediaExt } => !!f);

  return resolveMedia(mediaFiles);
}
