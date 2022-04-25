import { ButtonUnstyledProps } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { toggleCaption } from "@slice/controls";
import { addIcon } from "obsidian";
import React, { useCallback } from "react";

import offIcon from "./off.svg";
import onIcon from "./on.svg";

const onIconId = "caption-on",
  offIconId = "caption-off";

addIcon(onIconId, onIcon);
addIcon(offIconId, offIcon);

import Toggle from "../basic/toggle";
export const CaptionButton = React.forwardRef<
  HTMLButtonElement,
  ButtonUnstyledProps
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function CaptionButton(props, ref) {
    const captionOn = useAppSelector(
      (state) => state.controls.captions.active !== -1,
    );
    const captionAvailable = useAppSelector(
      (state) => state.controls.captions.list.length > 0,
    );
    const dispatch = useAppDispatch();

    const handleClick = useCallback(
      () => dispatch(toggleCaption()),
      [dispatch],
    );

    return captionAvailable ? (
      <Toggle
        {...props}
        ref={ref}
        aria-label={captionOn ? "Disable Caption" : "Enable Caption"}
        selected={captionOn}
        onClick={handleClick}
        selectedIcon={onIconId}
        unselectedIcon={offIconId}
      />
    ) : null;
  },
);
