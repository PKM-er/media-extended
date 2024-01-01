import type { MediaErrorCode } from "@vidstack/react";
import type MediaPlugin from "../lib/plugin";
import { toSerilizableTimeRange } from "../lib/time-range";

export function registerEvents(plugin: MediaPlugin) {
  const player = plugin.media;
  const port = plugin.controller;
  plugin.registerDomEvent(player, "abort", handleAbort);
  plugin.registerDomEvent(player, "emptied", handleEmptied);
  plugin.registerDomEvent(player, "error", handleError);
  plugin.registerDomEvent(player, "volumechange", handleVolumeChange);
  plugin.registerDomEvent(player, "durationchange", handleDurationChange);
  plugin.registerDomEvent(player, "progress", handleProgress);
  plugin.registerDomEvent(player, "stalled", handleStalled);
  plugin.registerDomEvent(player, "suspend", handleSuspend);
  plugin.registerDomEvent(player, "ratechange", handleRateChange);
  plugin.registerDomEvent(player, "seeked", handleSeeked);
  plugin.registerDomEvent(player, "seeking", handleSeeking);
  plugin.registerDomEvent(player, "ended", handleEnded);
  plugin.registerDomEvent(player, "waiting", handleWaiting);

  function handleAbort() {
    port.send("abort", void 0);
  }

  function handleEmptied() {
    port.send("emptied", void 0);
  }

  function handleError() {
    if (player.error) {
      port.send("error", {
        code: player.error.code as MediaErrorCode,
        message: player.error.message,
      });
    }
  }

  function handleVolumeChange() {
    port.send("volumechange", {
      muted: player.muted,
      volume: player.volume,
    });
  }

  function handleDurationChange() {
    port.send("durationchange", {
      played: toSerilizableTimeRange(player.played),
      duration: player.duration,
    });
  }

  function handleProgress() {
    port.send("progress", {
      buffered: toSerilizableTimeRange(player.buffered),
      seekable: toSerilizableTimeRange(player.seekable),
    });
  }

  function handleStalled() {
    port.send("stalled", {
      readyState: player.readyState,
    });
  }

  function handleSuspend() {
    port.send("suspend", void 0);
  }

  function handleRateChange() {
    port.send("ratechange", { rate: player.playbackRate });
  }

  function handleSeeked() {
    port.send("seeked", {
      current: player.currentTime,
      played: toSerilizableTimeRange(player.played),
      duration: player.duration,
      ended: player.ended,
    });
  }

  function handleSeeking() {
    port.send("seeking", {
      current: player.currentTime,
    });
  }

  function handleEnded() {
    port.send("ended", {
      controls: player.controls,
      current: player.currentTime,
      played: toSerilizableTimeRange(player.played),
      duration: player.duration,
      ended: player.ended,
    });
  }

  function handleWaiting() {
    port.send("waiting", {
      readyState: player.readyState,
    });
  }
}
