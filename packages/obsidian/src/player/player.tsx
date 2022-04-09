import "@styles/player.less";

import { useAppSelector } from "@player/hooks";
import React from "react";

import Controls from "./component/controls";
import useFullScreen from "./component/fullscreen";
import HTMLPlayer from "./component/html5";
import VideoWarpper from "./component/video-warpper";
import YoutubePlayer from "./component/youtube";
import { selectPlayerType } from "./slice/provider";

const Player = () => {
  const containerRef = useFullScreen();
  const provider = useAppSelector(selectPlayerType);

  return (
    <div className="mx-player" ref={containerRef}>
      <VideoWarpper>
        {provider === "audio" || provider === "video" ? (
          <HTMLPlayer />
        ) : provider === "youtube" ? (
          <YoutubePlayer />
        ) : null}
      </VideoWarpper>
      <Controls />
    </div>
  );
};
export default Player;
