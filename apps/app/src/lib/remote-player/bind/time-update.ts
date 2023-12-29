import type { CommRemote } from "../type";
import { RAFLoop } from "../utils/raf-loop";
import { toSerilizableTimeRange } from "../utils/time-range";

/**
 * The `timeupdate` event fires surprisingly infrequently during playback, meaning your progress
 * bar (or whatever else is synced to the currentTime) moves in a choppy fashion. This helps
 * resolve that by retrieving time updates in a request animation frame loop.
 */
export function fluentTimeUpdate(player: HTMLMediaElement, port: CommRemote) {
  const _timeRAF = new RAFLoop(onTimeUpdate);
  let _paused: boolean;
  function onPauseUpdate() {
    if (_paused === player.paused) return;
    _paused = player.paused;
    if (player.paused) {
      player.addEventListener("timeupdate", onTimeUpdate);
    } else {
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
