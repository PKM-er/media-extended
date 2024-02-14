import { useMediaPlayer } from "@vidstack/react";
import { useEffect, useRef } from "react";
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
  const { volume, tempFragment, ...props } = useMediaViewStore((s) => s.hash);
  return props;
}

export function useDefaultVolume() {
  const player = useMediaPlayer();
  const { volume } = useMediaViewStore((s) => s.hash);
  const defaultVolume = useSettings((s) => s.defaultVolume / 100);

  const initVolume = volume ?? defaultVolume;
  const initVolumeRef = useRef<number>(initVolume);
  initVolumeRef.current = initVolume;

  useEffect(
    () =>
      player?.subscribe(({ canPlay }) => {
        if (canPlay) player.volume = initVolumeRef.current;
      }),
    [player],
  );
}
