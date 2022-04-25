import "@styles/player.less";

import { useAspectRatio, useKeepRatio } from "@hook-utils";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { useMemoizedFn } from "ahooks";
import cls from "classnames";
import React, { useCallback, useRef } from "react";

import BilibiliPlayer from "./component/bilibili";
import Controls from "./component/controls";
import useFullScreen from "./component/fullscreen";
import HTMLPlayer from "./component/html5";
import TextTracks from "./component/text-tracks";
import YoutubePlayer from "./component/youtube";
import { dragSeek, dragSeekEnd } from "./slice/controls";
import { selectPlayerType } from "./slice/provider";
import { HTML5PlayerTypes } from "./slice/provider/types";
import { useSizeRef } from "./utils/hooks/use-size";

const useDragForward = (target: React.RefObject<HTMLElement>) => {
  const dispatch = useAppDispatch();
  const sizeRef = useSizeRef(target);

  const startXRef = useRef<number>(-1);
  return {
    onTouchStart: useCallback((e: React.TouchEvent<HTMLElement>) => {
      e.stopPropagation();
      startXRef.current = e.touches[0].clientX;
    }, []),
    onTouchMove: useMemoizedFn((e: React.TouchEvent<HTMLElement>) => {
      const size = sizeRef.current;
      if (!size?.width) return;
      const offsetX = e.touches[0].clientX - startXRef.current;
      const forwardSeconds = (offsetX / size.width) * 60;
      dispatch(dragSeek(forwardSeconds));
    }),
    onTouchEnd: useCallback((e: React.TouchEvent<HTMLElement>) => {
      e.stopPropagation();
      startXRef.current = -1;
      dispatch(dragSeekEnd());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  };
};

const Player = ({
  onBlur,
  onFocus,
}: {
  onFocus?: React.FocusEventHandler<HTMLDivElement>;
  onBlur?: React.FocusEventHandler<HTMLDivElement>;
}) => {
  const containerRef = useFullScreen();
  const playerType = useAppSelector(selectPlayerType),
    provider = useAppSelector((state) => state.provider.source?.from);

  const keepRatio = useKeepRatio(containerRef);

  const ratioProps = useAspectRatio(keepRatio, "mx__video-wrapper");

  const paused = useAppSelector((state) => state.controls.paused);

  return (
    <div
      className={cls("mx-player", { mx__paused: paused })}
      ref={containerRef}
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={-1}
      onKeyDownCapture={handleKeyDownCapture}
      {...useDragForward(containerRef)}
    >
      {playerType === "youtube" ? (
        <YoutubePlayer {...ratioProps} />
      ) : HTML5PlayerTypes.includes(playerType as any) ? (
        <HTMLPlayer {...ratioProps} />
      ) : provider === "bilibili" ? (
        <BilibiliPlayer {...ratioProps} />
      ) : null}
      <Controls />
      <TextTracks />
    </div>
  );
};
export default Player;

const handleKeyDownCapture: React.KeyboardEventHandler<HTMLDivElement> = (
  evt,
) => {
  // prevent conflict with toggle play/pause
  if (evt.key === " ") evt.preventDefault();
};
