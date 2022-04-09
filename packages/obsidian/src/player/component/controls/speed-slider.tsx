import "@styles/speed-slider.less";

import { SliderUnstyled } from "@mui/base";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { setPlaybackRate } from "@slice/controls";
import React, { useCallback } from "react";

const valuetext = (speed: number) => `${speed}×`,
  valueLabelFormat = (speed: number) => `${speed}×`,
  mark = (speed: number) => {
    if (speed % 1 === 0) {
      return <span className="primary-speed-mark">{speed}</span>;
    } else if (speed % 0.5 === 0) {
      return speed;
    } else {
      return (
        <span className="secondary-speed-mark">
          {speed.toFixed(2).substring(1)}
        </span>
      );
    }
  };

const valToSpeed = (value: number) => {
    if (value < 4) {
      return 0.25 * value + 1;
    } else {
      return 2 ** (value - 3);
    }
  },
  speedToVal = (speed: number) => {
    if (speed > 2) {
      return Math.log2(speed) + 3;
    } else {
      return (speed - 1) / 0.25;
    }
  };

const marks = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4, 8].map((speed) => ({
  value: speedToVal(speed),
  label: mark(speed),
}));

const max = 16,
  min = 0.25;

const SpeedSlider = () => {
  const speed = useAppSelector((state) => state.controls.playbackRate);
  const dispatch = useAppDispatch();
  const value = speedToVal(speed);

  const handleSilderChange = useCallback(
      (_e: any, newValue: number | number[]) => {
        dispatch(setPlaybackRate(valToSpeed(newValue as number)));
      },
      [dispatch],
    ),
    handleInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
      (event) => {
        const input = event.target as HTMLInputElement;
        if (input.validity.valid && input.value) {
          dispatch(setPlaybackRate(+input.value));
        }
      },
      [dispatch],
    );

  return (
    <div className="speed-slider">
      <SliderUnstyled
        track={false}
        value={typeof value === "number" ? value : 0}
        onChange={handleSilderChange}
        scale={valToSpeed}
        marks={marks}
        getAriaValueText={valuetext}
        valueLabelDisplay="auto"
        valueLabelFormat={valueLabelFormat}
        step={1}
        min={speedToVal(min)}
        max={speedToVal(max)}
        aria-label="Speed Slider"
        aria-valuemin={min}
        aria-valuemax={max}
      />
      <input
        type="number"
        step="0.05"
        min={0.1}
        max={max}
        value={speed}
        aria-label="Speed Input"
        onChange={handleInputChange}
      />
    </div>
  );
};
export default SpeedSlider;
