import "@styles/progress-label.less";

import { useAppSelector } from "@player/hooks";
import format from "format-duration";
import React from "react";

const ProgressLabel = () => {
  const currentTime = useAppSelector((state) =>
      format(state.controls.currentTime * 1e3),
    ),
    duration = useAppSelector((state) => {
      const { duration } = state.controls;
      return duration !== null && format(duration * 1e3);
    });

  return (
    <span className="mx__progress-label">
      {currentTime} / {duration}
    </span>
  );
};
export default ProgressLabel;
