import type { PlayerSrc } from "@vidstack/react";
import { useMemo } from "react";
import { encodeWebpageUrl } from "@/lib/remote-player/encode";
import { toInfoKey } from "@/media-note/note-index/def";
import { isFileMediaInfo } from "../info/media-info";
import { useApp, useMediaViewStore } from "./context";

export function useSource() {
  const mediaInfo = useMediaViewStore((s) => s.source?.url);
  const { vault } = useApp();
  const mediaInfoKey = mediaInfo ? toInfoKey(mediaInfo) : null;
  const src = useMemo(() => {
    if (!mediaInfo) return;
    if (isFileMediaInfo(mediaInfo)) {
      return vault.getResourcePath(mediaInfo.file);
    }
    return mediaInfo.source.href;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaInfoKey]);

  const type = useMediaViewStore(
    (s): "video/mp4" | "audio/mp3" | "webpage" | undefined => {
      const viewType = s.source?.viewType;
      if (!viewType) return;
      if (viewType === "mx-webpage") return "webpage";
      if (viewType?.endsWith("video")) return "video/mp4";
      if (viewType?.endsWith("audio")) return "audio/mp3";
    },
  );
  if (!src) return;

  if (type === "webpage") {
    return { src: encodeWebpageUrl(src) } satisfies PlayerSrc;
  }
  return { src, type } satisfies PlayerSrc;
}
