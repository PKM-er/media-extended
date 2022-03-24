import type { TimeSpan } from "mx-lib";
import { Ref, useEffect } from "preact/compat";
import type { ParsedQuery } from "query-string";

export const useFrag = (
  timeSpan: TimeSpan | null,
  ref: Ref<HTMLMediaElement>,
) => {
  useEffect(() => {
    const onPlaying = (evt: Event) => {
      const { start, end } = timeSpan!,
        player = evt.target as HTMLMediaElement;
      if (player.currentTime > end || player.currentTime < start) {
        player.currentTime = start;
      }
    };
    const onTimeUpdate = (evt: Event) => {
      const { start, end } = timeSpan!,
        player = evt.target as HTMLMediaElement;
      if (player.currentTime > end) {
        if (!player.loop) {
          player.pause();
        } else {
          player.currentTime = start;
          // continue to play in loop
          // if temporal fragment (#t=,2 at the end of src) paused the video
          if (player.paused) player.play();
        }
      } else if (player.currentTime < start) {
        player.currentTime = start;
      }
    };
    const player = ref.current;
    if (timeSpan && player) {
      if (player.paused && player.currentTime !== timeSpan.start) {
        player.currentTime = timeSpan.start;
      }
      const options: AddEventListenerOptions = { passive: true };
      player.addEventListener("playing", onPlaying, options);
      player.addEventListener("time-update", onTimeUpdate, options);
      return () => {
        player.removeEventListener("playing", onPlaying, options);
        player.removeEventListener("time-update", onTimeUpdate, options);
      };
    }
    // https://epicreact.dev/why-you-shouldnt-put-refs-in-a-dependency-array/
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSpan]);
};

/** Player Properties that can be controlled by hash */
type PlayerProperties = "loop" | "muted" | "autoplay" | "controls";
const hashOpts = new Map<string, PlayerProperties>([
  ["loop", "loop"],
  ["mute", "muted"],
  ["play", "autoplay"],
  ["controls", "controls"],
]);

/**
 * @returns return controls property if it is set in the query string
 */
export const useHashProps = (
  query: ParsedQuery<string>,
  ref: Ref<HTMLMediaElement>,
) => {
  useEffect(() => {
    const player = ref.current;
    if (query && player) {
      let result;
      (result = is(query, "loop")) !== !player.loop && (player.loop = result);
      (result = is(query, "muted")) !== !player.muted &&
        (player.muted = result);
      (result = is(query, "autoplay")) !== !player.autoplay &&
        (player.autoplay = result);
    }
    // https://epicreact.dev/why-you-shouldnt-put-refs-in-a-dependency-array/
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
};

export const is = (
  hashQuery: ParsedQuery<string>,
  prop: PlayerProperties,
): boolean => {
  if (!hashQuery) return false;
  for (const [queryKey, playerProp] of hashOpts) {
    if (prop === playerProp && hashQuery[queryKey] === null) return true;
  }
  return false;
};
