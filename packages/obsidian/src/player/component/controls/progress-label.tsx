import "@styles/progress-label.less";

import { secondToDuration } from "@misc";
import { useAppSelector } from "@player/hooks";
import React from "react";

const ProgressLabel = () => {
  const currentTime = useAppSelector((state) => state.controls.currentTime),
    duration = useAppSelector((state) => {
      const { duration } = state.controls;
      return duration !== null && duration;
    });

  return (
    <span className="mx__progress-label">
      {secondToDuration(currentTime)} / {duration && secondToDuration(duration)}
    </span>
  );
};
export default ProgressLabel;
