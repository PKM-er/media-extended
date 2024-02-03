import type { MediaVolumeChange } from "@vidstack/react";
import { useCallback, useState } from "react";
import { convertHashToProps } from "@/lib/hash/hash-prop";
import { useMediaViewStore } from "../context";

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
  const hash = useMediaViewStore((s) => s.hash);
  const { volume: init, ...props } = convertHashToProps(hash);

  const [volume, setVolume] = useState(init ?? 1);
  return {
    ...props,
    volume,
    onVolumeChange: useCallback((details: MediaVolumeChange) => {
      setVolume(details.volume);
    }, []),
  };
}
