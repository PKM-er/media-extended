import type { TempFragment } from "./temporal-frag";
import { parseTempFrag } from "./temporal-frag";

export interface HashProps {
  loop: true | undefined;
  muted: true | undefined;
  autoplay: true | undefined;
  controls: boolean | undefined;
  volume: number | undefined;
  tempFragment: TempFragment | null;
}

/** check if certain prop exists in given hash */
export function parseHashProps(hash: string): HashProps {
  const query = new URLSearchParams(hash.replace(/^#+/, ""));
  const controls =
    !query.has("noctrl") && !query.has("controls")
      ? undefined
      : query.has("controls");

  return {
    loop: query.has("loop") ? true : undefined,
    muted: query.has("mute") ? true : undefined,
    autoplay: query.has("play") ? true : undefined,
    controls,
    volume: parseVolume(query.get("vol")),
    tempFragment: parseTempFrag(hash),
  };
}

function parseVolume(volume: string | null): number | undefined {
  if (!volume) return;
  const parsed = parseInt(volume, 10);
  if (!(!isNaN(parsed) && parsed >= 0 && parsed <= 100)) return;

  return parsed / 100;
}
