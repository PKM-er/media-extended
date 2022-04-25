import "@styles/caption.less";

import { useAppSelector } from "@player/hooks";
import React from "react";

const Captions = () => {
  const caption = useAppSelector((state) => state.interface.activeCues);
  return (
    <div className="mx__captions">
      <span className="mx__caption">{caption}</span>
    </div>
  );
};

export default Captions;
