import "@styles/player.less";

import { useAppDispatch, useAppSelector } from "@player/hooks";
import React from "react";

import BilibiliPlayer from "./component/bilibili";
import { useUpdateOnResize } from "./component/browser-view/use-update-bound";
import Controls from "./component/controls";
import useFullScreen from "./component/fullscreen";
import HTMLPlayer from "./component/html5";
import VideoWarpper, { useKeepRatio } from "./component/video-warpper";
import YoutubePlayer from "./component/youtube";
import { reposition, repositionDone } from "./slice/browser-view";
import { selectPlayerType } from "./slice/provider";

const Player = () => {
  const containerRef = useFullScreen();
  const playerType = useAppSelector(selectPlayerType),
    provider = useAppSelector((state) => state.provider.source?.from);

  const keepRatio = useKeepRatio(containerRef);
  const dispatch = useAppDispatch();
  useUpdateOnResize(
    containerRef,
    () => dispatch(reposition()),
    () => dispatch(repositionDone()),
  );

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
