import "@styles/progress-bar.less";

import { SliderUnstyled } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@store-hooks";
import { isTimestamp, secondToDuration } from "mx-base";
import { progressBarSeek, progressBarSeekEnd, selectSeekTime } from "mx-store";
import {
  selectBuffered,
  selectCurrentTime,
  selectDuration,
  selectFrag,
} from "mx-store";
import React from "react";

const valuetext = (seconds: number) => secondToDuration(seconds);

const useTimeRange = () => {
  const duration = useAppSelector(selectDuration);
  const frag = useAppSelector(selectFrag);

  let min = 0,
    max = duration;
  if (frag) {
    const [start, end] = frag;
    if (!isTimestamp(frag)) {
      start && (min = start);
      end && end !== Infinity && (max = end);
    }
  }
  if (max === null) {
    max = 100;
  }
  return { min, max };
};

const ProgressBar = () => {
  const dispatch = useAppDispatch();

  const currentTime = useAppSelector(selectCurrentTime),
    seekTime = useAppSelector(selectSeekTime);

  const range = useTimeRange();

  return (
    <>
      <SliderUnstyled
        className="mx__media-progress"
        components={{ Rail: BufferProgress }}
        value={seekTime ?? currentTime ?? 0}
        {...range}
        step={0.01}
        getAriaValueText={valuetext}
        valueLabelDisplay="auto"
        valueLabelFormat={valuetext}
        onChange={(_e, newValue) =>
          dispatch(progressBarSeek(newValue as number))
        }
        onChangeCommitted={() => dispatch(progressBarSeekEnd())}
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
    const duration = useAppSelector(selectDuration),
      buffered = useAppSelector(selectBuffered);

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
