import React, { useContext, useMemo } from "react";

import { ControlsContext } from "../misc";

const ProgressBar = () => {
  const { timeSpan } = useContext(ControlsContext);

  return useMemo(
    () => (
      <vds-timespan-slider min={timeSpan?.start} max={timeSpan?.end}>
        <vds-slider-value-text
          type="pointer"
          format="time"
        ></vds-slider-value-text>
        <div className="slider-track"></div>
        <div className="slider-track fill"></div>
        <div className="slider-thumb-container">
          <div className="slider-thumb"></div>
        </div>
      </vds-timespan-slider>
    ),
    [timeSpan?.start, timeSpan?.end],
  );
};
export default ProgressBar;
