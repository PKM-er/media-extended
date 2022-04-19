import "@styles/progress-bar.less";

import { SliderUnstyled } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { userSeek, userSeekEnd } from "@slice/controls";
import format from "format-duration";
import React from "react";

const valuetext = (value: number) => format(value * 1e3);

const useTimeRange = () => {
  const duration = useAppSelector((state) => state.controls.duration);
  const frag = useAppSelector((state) => state.controls.fragment);

  let min = 0,
    max = duration;
  if (frag) {
    [min, max] = frag;
    if (max === Infinity) max = duration;
  }
  if (max === null) {
    max = 100;
  }
  return { min, max };
};

const ProgressBar = () => {
  const dispatch = useAppDispatch();

  const currentTime = useAppSelector((state) => state.controls.currentTime),
    seekTime = useAppSelector((state) => state.controls.userSeek?.currentTime);

  const range = useTimeRange();

  return (
    <>
      <SliderUnstyled
        className="mx__media-progress"
        components={{ Rail: BufferProgress }}
        value={seekTime ?? currentTime}
        {...range}
        step={0.01}
        getAriaValueText={valuetext}
        valueLabelDisplay="auto"
        valueLabelFormat={valuetext}
        onChange={(e, newValue) => {
          dispatch(userSeek(newValue as number));
        }}
        onChangeCommitted={(e, newValue) => {
          dispatch(userSeekEnd());
        }}
      />
    </>
  );
};

export default ProgressBar;

const BufferProgress = React.forwardRef<
  HTMLProgressElement,
  { className: string }
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function BufferProgress({ className }, ref) {
    const duration = useAppSelector((state) => state.controls.duration),
      buffered = useAppSelector((state) => state.controls.buffered);

    const range = useTimeRange();

    return (
      <progress
        className={className}
        value={duration ? buffered : 0}
        {...range}
      />
    );
  },
);
