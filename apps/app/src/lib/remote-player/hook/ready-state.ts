import type MediaPlugin from "../lib/plugin";
import { toSerilizableTimeRange } from "../lib/time-range";

/**
 * for cases where player is hooked after load event is fired
 * we need to manually trigger them to ensure the readyState is in sync
 */
export function handleReadyState(plugin: MediaPlugin) {
  const player = plugin.media;
  const port = plugin.controller;
  console.log("BIND", player.readyState);
  plugin.registerDomEvent(player, "loadstart", onLoadStart);
  plugin.registerDomEvent(player, "loadeddata", onLoadedData);
  plugin.registerDomEvent(player, "loadedmetadata", onLoadedMetadata);
  plugin.registerDomEvent(player, "canplay", onCanPlay);
  plugin.registerDomEvent(player, "canplaythrough", onCanPlayThrough);

  if (player.readyState === 0) player.load();
  if (player.readyState >= 0) onLoadStart();
  if (player.readyState >= 1) onLoadedMetadata();
  if (player.readyState >= 2) onLoadedData();
  if (player.readyState >= 3) onCanPlay();
  if (player.readyState >= 4) onCanPlayThrough();

  function onLoadStart() {
    port.send("loadstart", {
      networkState: player.networkState,
    });
  }
  function onLoadedMetadata() {
    port.send("loadedmetadata", void 0);
  }
  function onLoadedData() {
    port.send("loadeddata", void 0);
  }
  function onCanPlay() {
    port.send("canplay", {
      buffered: toSerilizableTimeRange(player.buffered),
      seekable: toSerilizableTimeRange(player.seekable),
      duration: player.duration,
    });
  }
  function onCanPlayThrough() {
    port.send("canplaythrough", {
      buffered: toSerilizableTimeRange(player.buffered),
      seekable: toSerilizableTimeRange(player.seekable),
      duration: player.duration,
    });
  }
}
