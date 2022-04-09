import "@styles/volume-slider.less";

import { SliderUnstyled } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import React, { useCallback } from "react";

import { setVolume } from "../../slice/controls";

const VolumeSilder = () => {
  const volume = useAppSelector((state) => state.controls.volume);
  const dispatch = useAppDispatch();

  const handleSilderChange = useCallback(
    (_e: any, newValue: number | number[]) => {
      dispatch(setVolume(newValue as number));
    },
    [dispatch],
  );

  return (
    <SliderUnstyled
      aria-label="Volume"
      value={volume}
      aria-valuenow={volume * 100}
      min={0}
      aria-valuemin={0}
      max={1}
      aria-valuemax={100}
      step={0.01}
      onChange={handleSilderChange}
    />
  );
};

export default VolumeSilder;
