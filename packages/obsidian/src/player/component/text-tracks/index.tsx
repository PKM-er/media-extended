import "@styles/text-tracks.less";

import { useAppSelector } from "@player/hooks";
import React from "react";

const TextTracks = () => {
  const content = useAppSelector((state) => state.interface.activeCues);
  return (
    <div className="mx__text-track-container">
      {/* mostly used for positioning */}
      <div className="mx__text-track-display">
        <div className="mx__text-track-display-backdrop">
          <div className="mx__cue">{content}</div>
        </div>
      </div>
    </div>
  );
};

export default TextTracks;
