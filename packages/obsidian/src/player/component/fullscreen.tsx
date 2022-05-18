import "@styles/fullscreen.less";

import { useAppSelector } from "@player/hooks";
import { selectFscreen } from "@store";
import fscreen from "fscreen";
import { useRefEffect } from "react-use-ref-effect";

const isFullscreenEnabled = fscreen.fullscreenEnabled;

const FULL_SCREEN_FALLBACK_CLASS = "mx__fullscreen-fallback";

const enterFullscreen = async (container: HTMLElement) => {
  if (fscreen.fullscreenElement) {
    await fscreen.exitFullscreen();
  }
  await fscreen.requestFullscreen(container);
};
const exitFullscreen = async (container: HTMLElement) => {
  if (fscreen.fullscreenElement === container) await fscreen.exitFullscreen();
};

const useFullScreen = () => {
  const fullscreen = useAppSelector(selectFscreen);
  return useRefEffect<HTMLElement>(
    (container) => {
      if (isFullscreenEnabled) {
        fullscreen ? enterFullscreen(container) : exitFullscreen(container);
      } else {
        container.classList[fullscreen ? "add" : "remove"](
          FULL_SCREEN_FALLBACK_CLASS,
        );
      }
    },
    [fullscreen],
  );
};

export default useFullScreen;
