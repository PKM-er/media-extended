import { ButtonUnstyledProps } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { toggleTracks } from "mx-store";
import React, { useCallback } from "react";
import { MdClosedCaption, MdClosedCaptionDisabled } from "react-icons/md";

const onIconId = "caption-on",
  offIconId = "caption-off";

import Toggle from "../basic/toggle";
export const TracksToggle = React.forwardRef<
  HTMLButtonElement,
  ButtonUnstyledProps
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function TracksToggle(props, ref) {
    const enabled = useAppSelector(
      (state) => state.interface.textTracks.enabled,
    );

    const dispatch = useAppDispatch();

    const handleClick = useCallback(() => dispatch(toggleTracks()), [dispatch]);

    return (
      <Toggle
        {...props}
        ref={ref}
        aria-label={enabled ? "Disable Caption" : "Enable Caption"}
        selected={enabled}
        onClick={handleClick}
        selectedIcon={<MdClosedCaption />}
        unselectedIcon={<MdClosedCaptionDisabled />}
      />
    );
  },
);
