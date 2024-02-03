/** Player Properties that can be controlled by hash */
type PlayerProperties = "loop" | "muted" | "autoplay" | "controls" | "volume";

/** check if certain prop exists in given hash */
export const convertHashToProps = (hash: string | undefined) => {
  if (!hash) return {};
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
  } satisfies Partial<Record<PlayerProperties, boolean | number>>;
};

function parseVolume(volume: string | null): number | undefined {
  if (!volume) return;
  const parsed = parseInt(volume, 10);
  if (!(!isNaN(parsed) && parsed >= 0 && parsed <= 100)) return;

  return parsed / 100;
}
