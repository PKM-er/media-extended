import "@styles/player.less";

import { useAppSelector } from "@player/hooks";
import React from "react";

import BilibiliPlayer from "./component/bilibili";
import Controls from "./component/controls";
import useFullScreen from "./component/fullscreen";
import HTMLPlayer from "./component/html5";
import VideoWarpper, { useKeepRatio } from "./component/video-warpper";
import YoutubePlayer from "./component/youtube";
import { selectPlayerType } from "./slice/provider";

const Player = () => {
  const containerRef = useFullScreen();
  const playerType = useAppSelector(selectPlayerType),
    provider = useAppSelector((state) => state.provider.source?.from);

  const keepRatio = useKeepRatio(containerRef);

  return (
    <div className="mx-player" ref={containerRef}>
      <VideoWarpper keepRatio={keepRatio}>
        {playerType === "audio" || playerType === "video" ? (
          <HTMLPlayer />
        ) : playerType === "youtube" ? (
          <YoutubePlayer />
        ) : provider === "bilibili" ? (
          <BilibiliPlayer />
        ) : null}
      </VideoWarpper>
      <Controls />
    </div>
  );
};
export default Player;
