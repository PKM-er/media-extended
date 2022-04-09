import { autoUpdate, shift, useFloating } from "@floating-ui/react-dom";
import React, { useEffect, useMemo, useState } from "react";

import Button from "./basic/button";
import SpeedSlider from "./speed-slider";

const SpeedControl = () => {
  const { x, y, reference, floating, strategy, update, refs } = useFloating({
    placement: "top",
    middleware: [shift(/* { boundary: containerEl } */)],
  });

  const [focused, setFocused] = useState(false),
    [hovered, setHovered] = useState(false);
  const showSpeed = useMemo(() => focused || hovered, [focused, hovered]);

  useEffect(() => {
    if (!refs.reference.current || !refs.floating.current || !showSpeed) {
      return;
    }
    // Only call this when the floating element is rendered and focused
    return autoUpdate(refs.reference.current, refs.floating.current, update);
  }, [refs.reference, refs.floating, update, showSpeed]);

  return (
    <span
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label={"Playback Speed Control"}
    >
      <Button ref={reference} icon="gauge" />
      <div
        className="speed-slider-container"
        ref={floating}
        style={{
          position: strategy,
          top: y ?? "",
          left: x ?? "",
          opacity: showSpeed ? undefined : 0,
        }}
      >
        <SpeedSlider />
      </div>
    </span>
  );
};
export default SpeedControl;
