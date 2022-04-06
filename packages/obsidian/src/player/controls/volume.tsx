import "@vidstack/player/define/vds-mute-button.js";
import "@vidstack/player/define/vds-volume-slider.js";
import "./volume.less";

import { autoUpdate, shift, useFloating } from "@floating-ui/react-dom";
import { useIcon } from "@player/utils";
import type { MuteButtonElement, VolumeSliderElement } from "@vidstack/player";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "preact/compat";

import { PlayerContext } from "../misc";

declare module "preact/src/jsx" {
  namespace JSXInternal {
    interface IntrinsicElements {
      "vds-mute-button": HTMLAttributes<MuteButtonElement>;
      "vds-volume-slider": HTMLAttributes<VolumeSliderElement>;
    }
  }
}

const VolumeControl = () => {
  const muteBtn = useIcon<MuteButtonElement>(["volume-x", "volume"]);
  const { containerEl } = useContext(PlayerContext);

  const { x, y, reference, floating, strategy, update, refs } = useFloating({
    placement: "top",
    middleware: [shift({ boundary: containerEl })],
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
