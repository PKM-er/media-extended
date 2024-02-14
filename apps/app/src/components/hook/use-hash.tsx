import type { MediaVolumeChange } from "@vidstack/react";
import { useCallback, useState } from "react";
import { useMediaViewStore, useSettings } from "../context";

export function useControls() {
  const { controls: controlsHash } = useHashProps();
  const controlsExternal = useMediaViewStore((s) => s.controls);
  const controlsDefault = true;

  // use fallback if controls is not defined externally or in hash
  const controls =
    controlsExternal === undefined && controlsHash === undefined
      ? controlsDefault
      : controlsExternal || controlsHash;

  return controls;
}

export function useHashProps() {
  const {
    volume: init,
    tempFragment,
    ...props
  } = useMediaViewStore((s) => s.hash);
  const defaultVolume = useSettings((s) => s.defaultVolume / 100);

  const [volume, setVolume] = useState(init ?? defaultVolume);
  return {
    ...props,
    volume,
    onVolumeChange: useCallback((details: MediaVolumeChange) => {
      setVolume(details.volume);
    }, []),
  };
}
