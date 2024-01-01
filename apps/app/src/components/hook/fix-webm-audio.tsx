import { isVideoProvider, useMediaPlayer } from "@vidstack/react";
import { useEffect } from "react";

export function useViewTypeDetect(
  onViewTypeChange: (viewType: "audio" | "unknown") => any,
) {
  const player = useMediaPlayer();
  useEffect(() => {
    if (!player) return;
    return player.listen("loaded-metadata", (evt) => {
      const player = evt.target;
      if (!isVideoProvider(player.provider)) {
        onViewTypeChange("unknown");
        return;
      }
      const { videoHeight, videoWidth } = player.provider.video;
      onViewTypeChange(
        videoHeight === 0 || videoWidth === 0 ? "audio" : "unknown",
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);
}
