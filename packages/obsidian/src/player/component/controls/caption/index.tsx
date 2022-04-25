import "@styles/caption.less";

import { useAppSelector } from "@player/hooks";
import React from "react";

import Popover from "../basic/popover";
import { CaptionSelection } from "./menu";
import { CaptionButton } from "./toggle";

const CaptionControl = () => {
  const hasCaption = useAppSelector(
    (state) => state.controls.captions.list.length > 0,
  );

  return hasCaption ? (
    <Popover
      placement="top"
      className="mx__caption-control-container"
      render={() => <CaptionSelection />}
    >
      <CaptionButton />
    </Popover>
  ) : null;
};
export default CaptionControl;
