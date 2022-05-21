import "@styles/text-tracks.less";

import { useAppSelector } from "@store-hooks";
import React from "react";

import Popover from "../basic/popover";
import { TracksMenu } from "./menu";
import { TracksToggle } from "./toggle";

const TrackControl = () => {
  const hasCaption = useAppSelector(
    (state) => state.interface.textTracks.list.length > 0,
  );

  return hasCaption ? (
    <Popover
      placement="top"
      className="mx__caption-control-container"
      render={() => <TracksMenu />}
    >
      <TracksToggle />
    </Popover>
  ) : null;
};
export default TrackControl;
