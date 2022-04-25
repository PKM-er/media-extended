import "@styles/text-tracks.less";

import { useAppSelector } from "@player/hooks";
import React from "react";

const TextTracks = () => {
  const content = useAppSelector((state) => state.interface.activeCues);
  return (
    <div className="mx__captions">
      <span className="mx__caption">{content}</span>
    </div>
  );
};

export default TextTracks;
