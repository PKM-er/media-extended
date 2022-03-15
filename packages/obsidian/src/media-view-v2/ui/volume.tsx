import "@aidenlx/player/define/vds-mute-button.js";
import "@aidenlx/player/define/vds-volume-slider.js";
import "./volume.less";

import type { MuteButtonElement, VolumeSliderElement } from "@aidenlx/player";
import { autoUpdate, shift, useFloating } from "@floating-ui/react-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useIcon } from "./utils";
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vds-mute-button": React.HTMLProps<MuteButtonElement>;
      "vds-volume-slider": React.HTMLProps<VolumeSliderElement>;
    }
  }
}

interface VolumeControlProps {
  boundary?: React.RefObject<HTMLElement>;
}
const VolumeControl = ({ boundary }: VolumeControlProps) => {
  const muteBtn = useIcon<MuteButtonElement>(["volume-x", "volume"]);
  const { x, y, reference, floating, strategy, update, refs } = useFloating({
    placement: "top",
    middleware: [shift({ boundary: boundary?.current ?? undefined })],
  });
  const muteRef = useCallback(
    (btn: MuteButtonElement | null) => btn && (muteBtn(btn), reference(btn)),
    [muteBtn, reference],
  );

  const [focused, setFocused] = useState(false),
    [hovered, setHovered] = useState(false);
  const showVolume = useMemo(() => focused || hovered, [focused, hovered]);

  useEffect(() => {
    if (!refs.reference.current || !refs.floating.current || !showVolume) {
      return;
    }
    // Only call this when the floating element is rendered and focused
    return autoUpdate(refs.reference.current, refs.floating.current, update);
  }, [refs.reference, refs.floating, update, showVolume]);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <vds-mute-button ref={muteRef} />
      <div
        className="volume-slider-container"
        ref={floating}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          position: strategy,
          top: y ?? "",
          left: x ?? "",
          opacity: showVolume ? undefined : 0,
        }}
      >
        <vds-volume-slider disabled={!showVolume}>
          <div className="slider-track"></div>
          <div className="slider-track fill"></div>
          <div className="slider-thumb-container">
            <div className="slider-thumb"></div>
          </div>
        </vds-volume-slider>
      </div>
    </div>
  );
};
export default VolumeControl;
