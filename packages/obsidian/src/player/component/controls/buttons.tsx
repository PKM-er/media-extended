import { ButtonUnstyledProps } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import {
  requestTimestamp,
  requsetScreenshot,
  selectScreenshotSupported,
} from "@slice/action/thunk";
import { toggleFullscreen, toggleMute, togglePlay } from "@slice/controls";
import { setVolumeByOffest } from "@slice/controls/thunk";
import { useLatest } from "ahooks";
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
    const volume = useAppSelector((state) => state.controls.volume);
    const dispatch = useAppDispatch();

    const volumeRef = useLatest(volume);

    const handleClick = useCallback(() => {
      if (volumeRef.current !== 0) {
        dispatch(toggleMute());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);
    return (
      <Toggle
        {...props}
        ref={ref}
        aria-label={muted ? "Unmute" : "Mute"}
        selected={muted || volume === 0}
        onClick={handleClick}
        selectedIcon="volume-x"
        unselectedIcon="volume-2"
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
      () => dispatch(requsetScreenshot()),
      [dispatch],
    );
    const isSupported = useAppSelector(selectScreenshotSupported);
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

export const TimestampButton = React.forwardRef<
  HTMLButtonElement,
  ButtonUnstyledProps
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function TimestampButton(props, ref) {
    const dispatch = useAppDispatch();
    const handleClick = useCallback(
      () => dispatch(requestTimestamp()),
      [dispatch],
    );
    return (
      <Button
        {...props}
        ref={ref}
        icon="flag"
        onClick={handleClick}
        aria-label="Take timestamp"
      />
    );
  },
);

export { CaptionButton } from "./caption";
export { DanmakuButton } from "./danmaku-button";
