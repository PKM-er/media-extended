import { RAFLoop } from "../lib/raf-loop";
import { toSerilizableTimeRange } from "../lib/time-range";
import type { MsgCtrlRemote } from "../type";

/**
 * The `timeupdate` event fires surprisingly infrequently during playback, meaning your progress
 * bar (or whatever else is synced to the currentTime) moves in a choppy fashion. This helps
 * resolve that by retrieving time updates in a request animation frame loop.
 */
export function fluentTimeUpdate(
  player: HTMLMediaElement,
  port: MsgCtrlRemote,
) {
  const _timeRAF = new RAFLoop(onTimeUpdate);
  let _paused: boolean;
  function onPauseUpdate() {
    if (_paused === player.paused) return;
    _paused = player.paused;
    if (player.paused) {
      // if the player is paused, timeupdate will be enough to handle manual seeking
      player.addEventListener("timeupdate", onTimeUpdate);
    } else {
      // if the player is playing, we use the RAF loop instead
      player.removeEventListener("timeupdate", onTimeUpdate);
    }
  }
  onPauseUpdate();
  player.addEventListener("ended", () => {
    _timeRAF._stop();
    onPauseUpdate();
  });
  player.addEventListener("pause", () => {
    _timeRAF._stop();
    onPauseUpdate();
  });
  player.addEventListener("playing", () => {
    _timeRAF._start();
    onPauseUpdate();
  });
  function onTimeUpdate() {
    port.send("timeupdate", {
      current: player.currentTime,
      played: toSerilizableTimeRange(player.played),
    });
  }
}
