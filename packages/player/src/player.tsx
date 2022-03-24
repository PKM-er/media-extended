import "./ratio.less";

import { useRef } from "react";
import React from "react";

import { useAppSelector } from "./app/hooks";
import Controls from "./component/controls";
import HTMLPlayer from "./component/html5";
import YoutubePlayer from "./component/youtube";

const Player = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const from = useAppSelector((state) => state.provider.from);

  return (
    <div className="container" ref={containerRef}>
      {from === "audio" || from === "video" ? (
        <HTMLPlayer />
      ) : (
        <YoutubePlayer />
      )}
      <Controls containerRef={containerRef} />
    </div>
  );
};
export default Player;
