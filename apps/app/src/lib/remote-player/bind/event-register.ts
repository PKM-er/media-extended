import type { MediaErrorCode } from "@vidstack/react";
import { toSerilizableTimeRange } from "../lib/time-range";
import type { MsgCtrlRemote } from "../type";

export function registerEvents(player: HTMLMediaElement, port: MsgCtrlRemote) {
  player.addEventListener("abort", () => {
    port.send("abort", void 0);
  });
  player.addEventListener("emptied", () => {
    port.send("emptied", void 0);
  });
  player.addEventListener("error", () => {
    if (player.error) {
      port.send("error", {
        code: player.error.code as MediaErrorCode,
        message: player.error.message,
      });
    }
  });
  player.addEventListener("volumechange", () => {
    port.send("volumechange", {
      muted: player.muted,
      volume: player.volume,
    });
  });

  player.addEventListener("durationchange", () => {
    port.send("durationchange", {
      played: toSerilizableTimeRange(player.played),
      duration: player.duration,
    });
  });
  player.addEventListener("play", () => {
    port.send("play", void 0);
  });
  player.addEventListener("progress", () => {
    port.send("progress", {
      buffered: toSerilizableTimeRange(player.buffered),
      seekable: toSerilizableTimeRange(player.seekable),
    });
  });
  player.addEventListener("stalled", () => {
    port.send("stalled", {
      readyState: player.readyState,
    });
  });
  player.addEventListener("suspend", () => {
    port.send("suspend", void 0);
  });
  player.addEventListener("pause", () => {
    port.send("pause", {
      readyState: player.readyState,
    });
  });
  player.addEventListener("playing", () => {
    port.send("playing", void 0);
  });
  player.addEventListener("ratechange", () => {
    port.send("ratechange", { rate: player.playbackRate });
  });
  player.addEventListener("seeked", () => {
    port.send("seeked", {
      current: player.currentTime,
      played: toSerilizableTimeRange(player.played),
      duration: player.duration,
      ended: player.ended,
    });
  });
  player.addEventListener("seeking", () => {
    port.send("seeking", {
      current: player.currentTime,
    });
  });
  player.addEventListener("ended", () => {
    port.send("ended", {
      controls: player.controls,
      current: player.currentTime,
      played: toSerilizableTimeRange(player.played),
      duration: player.duration,
      ended: player.ended,
    });
  });
  player.addEventListener("waiting", () => {
    port.send("waiting", {
      readyState: player.readyState,
    });
  });
}
