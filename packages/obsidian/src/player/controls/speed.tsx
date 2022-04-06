import { autoUpdate, shift, useFloating } from "@floating-ui/react-dom";
import { useIcon } from "@player/utils";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "preact/compat";

import { ControlsContext, PlayerContext } from "../misc";
import SpeedSlider from "./speed-slider";

const SpeedControl = () => {
  const speedBtn = useIcon<HTMLDivElement>(["gauge"]);
  const { containerEl } = useContext(PlayerContext);

  const { x, y, reference, floating, strategy, update, refs } = useFloating({
    placement: "top",
    middleware: [shift({ boundary: containerEl })],
  });

  const [hidden, setHidden] = useState(true);
  const { player } = useContext(ControlsContext);

  useEffect(() => {
    if (player.current?.engine instanceof HTMLMediaElement) {
      setHidden(false);
    } else {
      setHidden(true);
    }
  }, [player]);

  const [focused, setFocused] = useState(false),
    [hovered, setHovered] = useState(false);
  const showVolume = useMemo(() => focused || hovered, [focused, hovered]);

  const speedRef = useCallback(
    (btn: HTMLDivElement | null) => btn && (speedBtn(btn), reference(btn)),
    [speedBtn, reference],
  );
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
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hidden={hidden}
      role="button"
      aria-label={"Playback Speed Control"}
    >
      <div className="player-controls-button" ref={speedRef} />
      {!hidden && (
        <div
          className="speed-slider-container"
          ref={floating}
          style={{
            position: strategy,
            top: y ?? "",
            left: x ?? "",
            opacity: showVolume ? undefined : 0,
          }}
        >
          <SpeedSlider />
        </div>
      )}
    </div>
  );
};
export default SpeedControl;
