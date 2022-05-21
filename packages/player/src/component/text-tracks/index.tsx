import "@styles/text-tracks.less";

import { useAppSelector } from "@store-hooks";
import cls from "classnames";
import React from "react";

const TextTracks = () => {
  const content = useAppSelector((state) => state.interface.activeCues);
  return (
    <div className="mx__text-track-container">
      {/* mostly used for positioning */}
      <div className="mx__text-track-display">
        <div
          className={cls("mx__text-track-display-backdrop", {
            "mx__text-track-empty": !content,
          })}
        >
          <span className="mx__cue">{content}</span>
        </div>
      </div>
    </div>
  );
};

export default TextTracks;
