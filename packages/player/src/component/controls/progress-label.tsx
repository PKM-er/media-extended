import "@styles/progress-label.less";

import { useAppSelector } from "@store-hooks";
import { secondToDuration } from "mx-base";
import { selectTimeDuration } from "mx-store";
import React from "react";

const ProgressLabel = () => {
  const [currentTime, duration] = useAppSelector(selectTimeDuration);

  return currentTime !== undefined ? (
    <span className="mx__progress-label">
      {secondToDuration(currentTime)}/
      {duration !== null && secondToDuration(duration)}
    </span>
  ) : null;
};
export default ProgressLabel;
