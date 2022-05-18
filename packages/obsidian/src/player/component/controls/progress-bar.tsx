import "@styles/progress-bar.less";

import { secondToDuration } from "@misc";
import { SliderUnstyled } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { progressBarSeek, progressBarSeekEnd } from "@slice/user-seek";
import {
  selectBuffered,
  selectCurrentTime,
  selectDuration,
  selectFrag,
} from "@store";
import { isTimestamp } from "mx-lib";
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
    seekTime = useAppSelector((state) => state.userSeek?.currentTime);

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
