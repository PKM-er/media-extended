import "@styles/speed.less";

import React from "react";
import { MdSpeed } from "react-icons/md";

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
      <Button icon={<MdSpeed />} />
    </Popover>
  );
};
export default SpeedControl;
