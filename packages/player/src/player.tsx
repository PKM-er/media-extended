import "@styles/player.less";

import { useAppDispatch, useAppSelector } from "@store-hooks";
import { useAspectRatio, useKeepRatio } from "@utils/hooks";
import { useMemoizedFn } from "ahooks";
import cls from "classnames";
import { isHTMLPlayerType, PlayerType, selectFilter } from "mx-store";
import { dragSeek, dragSeekEnd } from "mx-store";
import { selectPaused, selectPlayerType } from "mx-store";
import React, { useCallback, useRef } from "react";

import BilibiliPlayer from "./component/bilibili";
import Controls from "./component/controls";
import useFullScreen from "./component/fullscreen";
import HTMLPlayer from "./component/html5";
import TextTracks from "./component/text-tracks";
import YoutubePlayer from "./component/youtube";
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
  const playerType = useAppSelector(selectPlayerType);

  const keepRatio = useKeepRatio(containerRef);

  const filter = useAppSelector(selectFilter);
  const ratioProps = useAspectRatio(keepRatio, [
    "mx__video-wrapper",
    { "mx__video-filter": filter },
  ]);

  const paused = useAppSelector(selectPaused);

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
      {playerType === PlayerType.youtubeAPI ? (
        <YoutubePlayer {...ratioProps} />
      ) : playerType === PlayerType.bilibili ? (
        <BilibiliPlayer {...ratioProps} />
      ) : isHTMLPlayerType(playerType) ? (
        <div {...ratioProps}>
          <HTMLPlayer />
        </div>
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
