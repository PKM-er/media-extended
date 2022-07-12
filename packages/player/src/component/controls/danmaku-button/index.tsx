import { ButtonUnstyledProps } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@store-hooks";
import { selectDanmaku, toggleDanmaku } from "mx-store";
import { PlayerType } from "mx-store";
import React, { useCallback } from "react";

import Toggle from "../basic/toggle";
import DanmakuOff from "./off.svg";
import DanmakuOn from "./on.svg";
export const DanmakuButton = React.forwardRef<
  HTMLButtonElement,
  ButtonUnstyledProps
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function DanmakuButton(props, ref) {
    const danmakuOn = useAppSelector(selectDanmaku);
    const dispatch = useAppDispatch();

    const handleClick = useCallback(
      () => dispatch(toggleDanmaku()),
      [dispatch],
    );

    return danmakuOn !== null ? (
      <Toggle
        {...props}
        ref={ref}
        aria-label={danmakuOn ? "Disable Danmaku" : "Enable Danmaku"}
        selected={danmakuOn}
        onClick={handleClick}
        selectedIcon={<DanmakuOn />}
        unselectedIcon={<DanmakuOff />}
      />
    ) : null;
  },
);
