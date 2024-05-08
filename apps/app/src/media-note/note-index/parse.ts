import type { CachedMetadata } from "obsidian";
import type { MetaTextTrackInfo } from "@/transcript/handle/meta";
import { parseTextTrackFields } from "@/transcript/handle/meta";

export interface MediaNoteMeta {
  textTracks: MetaTextTrackInfo[];
}

export function parseMediaNoteMeta(meta: CachedMetadata): MediaNoteMeta {
  return {
    textTracks: parseTextTrackFields(meta),
  };
}
