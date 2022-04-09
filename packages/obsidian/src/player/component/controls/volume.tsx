import "@styles/volume.less";

import { autoUpdate, shift, useFloating } from "@floating-ui/react-dom";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { setVolume, setVolumeByOffest } from "@slice/controls";
import React, { useEffect, useMemo, useState } from "react";

import { MuteButton, VolumeButton } from "./buttons";
import VolumeSilder from "./volume-silder";

const VolumeControl = () => {
  // const { containerEl } = useContext(PlayerContext);

  const { x, y, reference, floating, strategy, update, refs } = useFloating({
    placement: "top",
    middleware: [shift(/* { boundary: containerEl } */)],
  });

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
    <span
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <MuteButton ref={reference} />
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
        <VolumeButton offset={-5} />
        <VolumeSilder />
        <VolumeButton offset={5} />
      </div>
    </span>
  );
};
export default VolumeControl;
