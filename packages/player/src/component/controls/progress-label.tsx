import "@styles/progress-label.less";

import { useAppSelector } from "@store-hooks";
import { secondToDuration } from "mx-base";
import { selectCurrentTime, selectDuration } from "mx-store";
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
