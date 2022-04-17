import { SliderUnstyled } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { setVolumeUnmute } from "@player/slice/controls";
import React, { useCallback } from "react";

const VolumeSilder = () => {
  const volume = useAppSelector((state) => state.controls.volume);
  const muted = useAppSelector((state) => state.controls.muted);
  const dispatch = useAppDispatch();

  const handleSilderChange = useCallback(
    (_e: any, newValue: number | number[]) => {
      dispatch(setVolumeUnmute(newValue as number));
    },
    [dispatch],
  );

  return (
    <SliderUnstyled
      classes={{ root: "mx__volume-slider" }}
      aria-label="Volume"
      value={muted ? 0 : volume}
      aria-valuenow={muted ? 0 : volume * 100}
      min={0}
      aria-valuemin={0}
      max={1}
      valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
      aria-valuemax={100}
      step={0.01}
      valueLabelDisplay="auto"
      onChange={handleSilderChange}
    />
  );
};

export default VolumeSilder;
