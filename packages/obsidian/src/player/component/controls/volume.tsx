import "@styles/volume.less";

import React from "react";

import Popover from "./basic/popover";
import { MuteButton } from "./buttons";
import VolumeSilder from "./volume-silder";

const VolumeControl = () => {
  return (
    <Popover
      placement="top"
      className="mx__volume-control-container"
      render={() => <VolumeSilder />}
    >
      <MuteButton />
    </Popover>
  );
};
export default VolumeControl;
