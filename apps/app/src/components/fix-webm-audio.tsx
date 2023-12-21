import { isVideoProvider, type MediaPlayerInstance } from "@vidstack/react";
import { useEffect, useState } from "react";

export function useViewTypeDetect(
  playerRef: React.RefObject<MediaPlayerInstance>,
) {
  const [state, setState] = useState<"audio" | "unknown">("unknown");
  useEffect(() => {
    if (!playerRef.current) return;
    return playerRef.current.listen("loaded-metadata", (evt) => {
      const player = evt.target;
      if (!isVideoProvider(player.provider)) {
        setState("unknown");
        return;
      }
      const { videoHeight, videoWidth } = player.provider.video;
      setState(videoHeight === 0 || videoWidth === 0 ? "audio" : "unknown");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerRef.current]);
  return state;
}
