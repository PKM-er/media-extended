import { ButtonUnstyledProps } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@store-hooks";
import { useLatest } from "ahooks";
import {
  requestTimestamp,
  requsetScreenshot,
  selectFscreen,
  selectPaused,
  selectVolumeMute,
} from "mx-store";
import { setVolumeByOffest, toggleMute, togglePlay } from "mx-store";
import { toggleFullscreen } from "mx-store";
import { selectScreenshotSupported } from "mx-store";
import React, { useCallback } from "react";
import {
  FiCamera,
  FiFlag,
  FiMaximize2,
  FiMinimize2,
  FiPause,
  FiPlay,
  FiVolume1,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";

import Button from "./basic/button";
import Toggle from "./basic/toggle";

export const PlayButton = React.forwardRef<
  HTMLButtonElement,
  ButtonUnstyledProps
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function PlayButton(props, ref) {
    const paused = useAppSelector(selectPaused);
    const dispatch = useAppDispatch();

    const handleClick = useCallback(() => dispatch(togglePlay()), [dispatch]);
    return paused !== undefined ? (
      <Toggle
        {...props}
        ref={ref}
        aria-label={paused ? "Play" : "Pause"}
        selected={paused}
        onClick={handleClick}
        selectedIcon={<FiPlay className="play" />}
        unselectedIcon={<FiPause className="pause" />}
      />
    ) : null;
  },
);

export const MuteButton = React.forwardRef<
  HTMLButtonElement,
  ButtonUnstyledProps
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function MuteButton(props, ref) {
    const [muted, volume] = useAppSelector(selectVolumeMute);
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
        selectedIcon={<FiVolumeX />}
        unselectedIcon={<FiVolume2 />}
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
    const fullscreen = useAppSelector(selectFscreen);
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
        selectedIcon={<FiMinimize2 />}
        unselectedIcon={<FiMaximize2 />}
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
        icon={<FiCamera />}
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
    )}%`;
    return (
      <Button
        {...props}
        ref={ref}
        icon={offset > 0 ? <FiVolume2 /> : <FiVolume1 />}
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
        icon={<FiFlag />}
        onClick={handleClick}
        aria-label="Take timestamp"
      />
    );
  },
);

export { DanmakuButton } from "./danmaku-button";
