import "@aidenlx/player/define/vds-timespan-slider.js";
import "@aidenlx/player/define/vds-slider-value-text.js";

import type { SliderElement, SliderValueTextElement } from "@aidenlx/player";
import React, { useContext, useMemo } from "preact/compat";

import { ControlsContext } from "../misc";

declare module "preact/src/jsx" {
  namespace JSXInternal {
    interface IntrinsicElements {
      "vds-timespan-slider": HTMLAttributes<SliderElement>;
      "vds-slider-value-text": Partial<SliderValueTextElement>;
    }
  }
}

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
