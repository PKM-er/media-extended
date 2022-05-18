import "@styles/progress-label.less";

import { secondToDuration } from "@misc";
import { useAppSelector } from "@player/hooks";
import { selectCurrentTime, selectDuration } from "@store";
import React from "react";

const ProgressLabel = () => {
  const currentTime = useAppSelector(selectCurrentTime),
    duration = useAppSelector(selectDuration);

  return (
    <span className="mx__progress-label">
      {secondToDuration(currentTime)}/
      {duration !== null && secondToDuration(duration)}
    </span>
  );
};
export default ProgressLabel;
