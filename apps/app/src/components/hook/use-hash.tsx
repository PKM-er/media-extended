import type { MediaPlayerInstance } from "@vidstack/react";
import { useMediaPlayer } from "@vidstack/react";
import { debounce } from "obsidian";
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

  const locked = useRef(false);

  useEffect(() => {
    const unlock = debounce(
      () => {
        locked.current = false;
      },
      1e3,
      true,
    );
    const updateVolume = (e: { target: MediaPlayerInstance }) => {
      e.target.provider?.setVolume(initVolumeRef.current);
      locked.current = true;
      unlock();
    };
    if (!player) return;
    const unloads = [
      player.listen("can-play-through", updateVolume),
      player.listen("can-play", updateVolume),
      player.listen("loaded-data", updateVolume),
      player.listen("loaded-metadata", updateVolume),
      player.subscribe(({ volume }) => {
        if (!locked.current || volume === initVolumeRef.current) return;
        player.provider?.setVolume(initVolumeRef.current);
      }),
    ];
    return () => unloads.forEach((u) => u());
  }, [player]);
}
