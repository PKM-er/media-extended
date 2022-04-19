import "@styles/player.less";

import { useAppSelector } from "@player/hooks";
import cls from "classnames";
import React from "react";

import BilibiliPlayer from "./component/bilibili";
import Controls from "./component/controls";
import useFullScreen from "./component/fullscreen";
import useAspectRatio from "./component/hooks/use-aspect-ratio";
import useKeepRatio from "./component/hooks/use-keep-ratio";
import HTMLPlayer from "./component/html5";
import YoutubePlayer from "./component/youtube";
import { selectPlayerType } from "./slice/provider";
import { HTML5PlayerTypes } from "./slice/provider-types";

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
    >
      {playerType === "youtube" ? (
        <YoutubePlayer {...ratioProps} />
      ) : HTML5PlayerTypes.includes(playerType as any) ? (
        <HTMLPlayer {...ratioProps} />
      ) : provider === "bilibili" ? (
        <BilibiliPlayer {...ratioProps} />
      ) : null}
      <Controls />
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
