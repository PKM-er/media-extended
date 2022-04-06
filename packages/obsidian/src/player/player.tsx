import "./ratio.less";

import { useAppSelector } from "@player/hooks";
import { useRef } from "react";
import React from "react";

import Controls from "./component/controls";
import HTMLPlayer from "./component/html5";
import YoutubePlayer from "./component/youtube";

const Player = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const provider = useAppSelector((state) => state.provider.source?.provider);

  return (
    <div className="mx-player" ref={containerRef}>
      {provider === "audio" || provider === "video" ? (
        <HTMLPlayer />
      ) : provider === "youtube" ? (
        <YoutubePlayer />
      ) : null}
      <Controls containerRef={containerRef} />
    </div>
  );
};
export default Player;
