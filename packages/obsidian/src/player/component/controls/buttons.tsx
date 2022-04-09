import { useAppDispatch, useAppSelector } from "@player/hooks";
import {
  setVolumeByOffest,
  toggleFullscreen,
  toggleMute,
  togglePlay,
} from "@slice/controls";
import React, { useCallback } from "react";

import { captureScreenshot } from "../../slice/html5";
import { selectPlayerType } from "../../slice/provider";
import Button from "./basic/button";
import Toggle from "./basic/toggle";

export const PlayButton = React.forwardRef<HTMLButtonElement, {}>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function PlayButton(_p, ref) {
    const paused = useAppSelector((state) => state.controls.paused);
    const dispatch = useAppDispatch();

    const handleClick = useCallback(() => dispatch(togglePlay()), [dispatch]);
    return (
      <Toggle
        aria-label={paused ? "Play" : "Pause"}
        selected={paused}
        onClick={handleClick}
        selectedIcon="play"
        unselectedIcon="pause"
      />
    );
  },
);

export const MuteButton = React.forwardRef<HTMLButtonElement, {}>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function MuteButton(_p, ref) {
    const muted = useAppSelector((state) => state.controls.muted);
    const dispatch = useAppDispatch();

    const handleClick = useCallback(() => dispatch(toggleMute()), [dispatch]);
    return (
      <Toggle
        ref={ref}
        aria-label={muted ? "Unmute" : "Mute"}
        selected={muted}
        onClick={handleClick}
        selectedIcon="volume"
        unselectedIcon="volume-x"
      />
    );
  },
);

export const FullscreenButton = React.forwardRef<HTMLButtonElement, {}>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function FullscreenButton(_p, ref) {
    const fullscreen = useAppSelector((state) => state.controls.fullscreen);
    const dispatch = useAppDispatch();

    const handleClick = useCallback(
      () => dispatch(toggleFullscreen()),
      [dispatch],
    );
    return (
      <Toggle
        aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        selected={fullscreen}
        onClick={handleClick}
        selectedIcon="minimize-2"
        unselectedIcon="maximize-2"
      />
    );
  },
);

export const ScreenshotButton = React.forwardRef<HTMLButtonElement, {}>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function ScreenshotButton(_p, ref) {
    const dispatch = useAppDispatch();
    const handleClick = useCallback(
      () => dispatch(captureScreenshot()),
      [dispatch],
    );
    const isSupported = useAppSelector(
      (state) => selectPlayerType(state) === "video",
    );
    return isSupported ? (
      <Button
        icon="camera"
        onClick={handleClick}
        aria-label="Capture Screenshot"
      />
    ) : null;
  },
);

export const VolumeButton = React.forwardRef<
  HTMLButtonElement,
  { offset: number }
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function VolumeButton({ offset }, ref) {
    const dispatch = useAppDispatch();
    const handleClick = useCallback(
      () => dispatch(setVolumeByOffest(offset)),
      [dispatch, offset],
    );

    const label = `Volume ${offset > 0 ? "Up" : "Down"} by ${Math.abs(
        offset,
      )}%`,
      icon = offset > 0 ? "volume-2" : "volume-1";
    return <Button icon={icon} onClick={handleClick} aria-label={label} />;
  },
);
