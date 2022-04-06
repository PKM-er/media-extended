import "./fullscreen.less";

import { useAppDispatch, useAppSelector } from "@player/hooks";
import { handleFullscreenChange, setFullscreen } from "@player/slice/controls";
import fscreen from "fscreen";
import React, { useCallback, useEffect } from "react";

const isFullscreenEnabled = fscreen.fullscreenEnabled;

const FULL_SCREEN_FALLBACK_CLASS = "fullscreen-fallback";

const useFullScreen = (ref: React.RefObject<HTMLElement>) => {
  const fullscreen = useAppSelector((state) => state.controls.fullscreen);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleChange = () => {
      dispatch(
        handleFullscreenChange(fscreen.fullscreenElement === ref.current),
      );
    };
    fscreen.addEventListener("fullscreenchange", handleChange);
    return () => fscreen.removeEventListener("fullscreenchange", handleChange);
  }, [dispatch, ref]);

  return {
    fullscreen,
    isFullscreenEnabled,
    enterFullscreen: useCallback(async () => {
      if (!ref.current) return;
      if (isFullscreenEnabled) {
        if (fscreen.fullscreenElement) {
          await fscreen.exitFullscreen();
        }
        await fscreen.requestFullscreen(ref.current);
      } else {
        ref.current.classList.add(FULL_SCREEN_FALLBACK_CLASS);
      }
      dispatch(setFullscreen(true));
    }, [dispatch, ref]),
    exitFullscreen: useCallback(async () => {
      if (isFullscreenEnabled) {
        if (fscreen.fullscreenElement === ref.current)
          await fscreen.exitFullscreen();
      } else if (ref.current) {
        ref.current.classList.remove(FULL_SCREEN_FALLBACK_CLASS);
      }
      dispatch(setFullscreen(false));
    }, [dispatch, ref]),
  };
};

export default useFullScreen;
