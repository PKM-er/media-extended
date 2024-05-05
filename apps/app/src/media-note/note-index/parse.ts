import type { CachedMetadata, MetadataCache } from "obsidian";
import type { TextTrackInfo } from "@/info/track-info";
import { parseTextTrackFields } from "@/transcript/handle/meta";

export interface MediaNoteMeta {
  textTracks: TextTrackInfo[];
}

export function parseMediaNoteMeta(
  meta: CachedMetadata,
  {
    metadataCache,
    sourcePath,
  }: { metadataCache: MetadataCache; sourcePath: string },
): MediaNoteMeta {
  return {
    textTracks: parseTextTrackFields(meta, (linkpath) =>
      metadataCache.getFirstLinkpathDest(linkpath, sourcePath),
    ),
  };
}
