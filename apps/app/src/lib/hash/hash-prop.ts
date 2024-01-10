/** Player Properties that can be controlled by hash */
type PlayerProperties = "loop" | "muted" | "autoplay" | "controls";

/** check if certain prop exists in given hash */
export const convertHashToProps = (
  hash: string | undefined,
): Partial<Record<PlayerProperties, boolean>> => {
  if (!hash)
    return {
      loop: false,
      muted: false,
      autoplay: false,
      controls: true,
    };
  const query = new URLSearchParams(hash.replace(/^#+/, ""));
  return {
    loop: query.has("loop"),
    muted: query.has("mute"),
    autoplay: query.has("play"),
    controls: !query.has("noctrl"),
  };
};
