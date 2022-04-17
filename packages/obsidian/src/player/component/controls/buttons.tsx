import { ButtonUnstyledProps } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { captureScreenshot } from "@player/slice/provider";
import {
  setVolumeByOffest,
  toggleFullscreen,
  toggleMute,
  togglePlay,
} from "@slice/controls";
import React, { useCallback } from "react";

import Button from "./basic/button";
import Toggle from "./basic/toggle";

export const PlayButton = React.forwardRef<
  HTMLButtonElement,
  ButtonUnstyledProps
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function PlayButton(props, ref) {
    const paused = useAppSelector((state) => state.controls.paused);
    const dispatch = useAppDispatch();

    const handleClick = useCallback(() => dispatch(togglePlay()), [dispatch]);
    return (
      <Toggle
        {...props}
        ref={ref}
        aria-label={paused ? "Play" : "Pause"}
        selected={paused}
        onClick={handleClick}
        selectedIcon="play"
        unselectedIcon="pause"
      />
    );
  },
);

export const MuteButton = React.forwardRef<
  HTMLButtonElement,
  ButtonUnstyledProps
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function MuteButton(props, ref) {
    const muted = useAppSelector((state) => state.controls.muted);
    const dispatch = useAppDispatch();

    const handleClick = useCallback(() => dispatch(toggleMute()), [dispatch]);
    return (
      <Toggle
        {...props}
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

export const FullscreenButton = React.forwardRef<
  HTMLButtonElement,
  ButtonUnstyledProps
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function FullscreenButton(props, ref) {
    const fullscreen = useAppSelector((state) => state.controls.fullscreen);
    const dispatch = useAppDispatch();

    const handleClick = useCallback(
      () => dispatch(toggleFullscreen()),
      [dispatch],
    );
    return (
      <Toggle
        {...props}
        ref={ref}
        aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        selected={fullscreen}
        onClick={handleClick}
        selectedIcon="minimize-2"
        unselectedIcon="maximize-2"
      />
    );
  },
);

export const ScreenshotButton = React.forwardRef<
  HTMLButtonElement,
  ButtonUnstyledProps
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function ScreenshotButton(props, ref) {
    const dispatch = useAppDispatch();
    const handleClick = useCallback(
      () => dispatch(captureScreenshot()),
      [dispatch],
    );
    const isSupported = useAppSelector(
      (state) => state.provider.captureScreenshot !== null,
    );
    return isSupported ? (
      <Button
        {...props}
        ref={ref}
        icon="camera"
        onClick={handleClick}
        aria-label="Capture Screenshot"
      />
    ) : null;
  },
);

export const VolumeButton = React.forwardRef<
  HTMLButtonElement,
  ButtonUnstyledProps & { offset: number }
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function VolumeButton({ offset, ...props }, ref) {
    const dispatch = useAppDispatch();
    const handleClick = useCallback(
      () => dispatch(setVolumeByOffest(offset)),
      [dispatch, offset],
    );

    const label = `Volume ${offset > 0 ? "Up" : "Down"} by ${Math.abs(
        offset,
      )}%`,
      icon = offset > 0 ? "volume-2" : "volume-1";
    return (
      <Button
        {...props}
        ref={ref}
        icon={icon}
        onClick={handleClick}
        aria-label={label}
      />
    );
  },
);
