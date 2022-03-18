import { captureScreenshot } from "mx-lib";
import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "preact/compat";

import { ControlsContext, PlayerContext } from "../misc";
import Button from "./button";
import { useIcon } from "./utils";

const ScreenshotButton = ({ disabled = false }: { disabled?: boolean }) => {
  const ScreenshotBtn = useIcon(["camera"]);
  const [hidden, setHidden] = useState(true);
  const { events } = useContext(PlayerContext);
  const { player } = useContext(ControlsContext);

  useEffect(() => {
    if (player.current?.engine instanceof HTMLVideoElement) {
      setHidden(false);
    } else {
      setHidden(true);
    }
  }, [player]);

  const handleClick = useCallback(() => {
    if (player.current?.engine instanceof HTMLVideoElement) {
      events.trigger("screenshot", captureScreenshot(player.current.engine));
    }
  }, [events, player]);

  return (
    <Button
      ref={ScreenshotBtn}
      onClick={handleClick}
      hidden={hidden}
      disabled={disabled}
      aria-label="Capture Screenshot"
    />
  );
};

export default ScreenshotButton;
