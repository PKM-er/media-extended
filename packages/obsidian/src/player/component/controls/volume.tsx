import "@styles/volume.less";

import React, { useRef } from "react";
import ReactDOM from "react-dom";

import Popover from "./basic/popover";
import { MuteButton, VolumeButton } from "./buttons";
import VolumeSilder from "./volume-silder";

const VolumeControl = () => {
  return (
    <Popover
      placement="top"
      className="volume-slider-container"
      render={() => (
        <>
          <VolumeButton offset={-5} />
          <VolumeSilder />
          <VolumeButton offset={5} />
        </>
      )}
    >
      <MuteButton />
    </Popover>
  );
};
export default VolumeControl;
