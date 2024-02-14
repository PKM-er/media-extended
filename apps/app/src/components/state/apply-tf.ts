import type { MediaPlayerInstance } from "@vidstack/react";
import { isTimestamp } from "@/lib/hash/temporal-frag";
import type { MediaViewState, MediaViewStoreApi } from "../context";

const tfNotInitial = new WeakSet<MediaPlayerInstance>();

export function handleTempFrag(store: MediaViewStoreApi) {
  store.subscribe((currState, prevState) => {
    if (currState.player === prevState.player) return;
    applyTempFrag(currState);
  });

  store.subscribe((currState, prevState) => {
    const player = currState.player;
    if (!player) return;

    const currSrc = currState.source;
    const prevSrc = prevState.source;

    if (currSrc === prevSrc) return;

    const currUrl = currSrc?.url;
    const prevUrl = prevSrc?.url;

    if (currUrl === prevUrl) return;
    if (
      (!currUrl && prevUrl !== undefined) ||
      (currUrl !== undefined && !currUrl.compare(prevUrl))
    ) {
      // when url is reset
      tfNotInitial.delete(player);
    }
  });
}

export async function applyTempFrag({
  player,
  hash: { tempFragment: tf },
}: MediaViewState) {
  if (!player || !tf) return;
  const initial = !tfNotInitial.has(player);
  tfNotInitial.add(player);
  // eslint-disable-next-line @typescript-eslint/naming-convention
  let _newTime: number | null = null;
  // allow 0.25s offset from end, in case delay in seeking
  const allowedOffset = 0.25;
  if (
    isTimestamp(tf) ||
    player.currentTime < tf.start ||
    Math.abs(player.currentTime - tf.end) < allowedOffset
  ) {
    _newTime = tf.start;
  } else if (player.currentTime - allowedOffset > tf.end) {
    _newTime = tf.end;
  }
  if (_newTime !== null) {
    const newTime = _newTime;
    player.currentTime = newTime;
    // trying to fix youtube iframe autoplay on initial seek
    if (
      !player.state.canPlay &&
      ["video/youtube"].includes(player.state.source.type) &&
      !player.state.autoPlay
    ) {
      await waitFor(player, "seeked");
      await player.pause();
    }
  }
  if (isTimestamp(tf) && player.state.canPlay && !initial) {
    await player.play(new Event("hashchange"));
  }
}

function waitFor(
  player: MediaPlayerInstance,
  event:
    | "time-update"
    | "play"
    | "can-play"
    | "canplay"
    | "timeupdate"
    | "seeking"
    | "seeked",
) {
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      resolve();
      unload();
    }, 5e3);
    const unload = player.listen(event, () => {
      resolve();
      window.clearTimeout(timeout);
      unload();
    });
  });
}
