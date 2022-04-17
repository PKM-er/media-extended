import "@styles/speed.less";

import React, { useCallback } from "react";

import { useAppDispatch, useAppSelector } from "../../hooks";
import { setPlaybackRate } from "../../slice/controls";
import Button from "./basic/button";
import Popover from "./basic/popover";
import SpeedSlider, { SpeedInput } from "./speed-slider";

const SpeedControl = () => {
  return (
    <Popover
      placement="top"
      className="mx__speed-control-container"
      render={() => (
        <>
          <SpeedSlider />
          <SpeedInput />
        </>
      )}
    >
      <Button icon="gauge" />
    </Popover>
  );
};
export default SpeedControl;
