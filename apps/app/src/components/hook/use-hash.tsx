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
  const props = convertHashToProps(hash);
  return props;
}
