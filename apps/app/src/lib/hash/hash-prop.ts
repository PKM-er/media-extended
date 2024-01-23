/** Player Properties that can be controlled by hash */
type PlayerProperties = "loop" | "muted" | "autoplay" | "controls";

/** check if certain prop exists in given hash */
export const convertHashToProps = (
  hash: string | undefined,
): Partial<Record<PlayerProperties, boolean>> => {
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
  };
};
