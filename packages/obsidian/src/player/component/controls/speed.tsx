import React from "react";

import Button from "./basic/button";
import Popover from "./basic/popover";
import SpeedSlider from "./speed-slider";

const SpeedControl = () => {
  return (
    <Popover
      placement="top"
      className="speed-slider-container"
      render={() => <SpeedSlider />}
    >
      <Button icon="gauge" />
    </Popover>
  );
};
export default SpeedControl;
