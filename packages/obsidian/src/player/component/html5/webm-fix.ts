import { useAppDispatch } from "@player/hooks";
import { LARGE_CURRENT_TIME } from "@slice/controls";
import { switchToAudio } from "@slice/provider";
import { useCallback, useState } from "react";

import { EventHandler } from "./event";

export const useWebmFixes = () => {
  const dispatch = useAppDispatch();
  const [height, setHeight] = useState<0 | undefined>(0);
  const onLoadedMetadata = useCallback<EventHandler>(
    (media) => {
      // if webm audio-only, switch to audio
      const { instance } = media;
      if (
        instance instanceof HTMLVideoElement &&
        (instance.videoHeight === 0 || instance.videoWidth === 0)
      ) {
        dispatch(switchToAudio());
      } else {
        setHeight(undefined);
      }

      // https://www.bugs.cc/p/webm-progress-bar-problem-and-solution/
      if (!instance.duration || instance.duration === Infinity) {
        instance.addEventListener(
          "timeupdate",
          () => (instance.currentTime = 0),
          { once: true },
        );
        instance.currentTime = LARGE_CURRENT_TIME;
      }
    },
    [dispatch],
  );
  return { onLoadedMetadata, height };
};
