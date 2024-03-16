import { useEffect, useState } from "react";
import { useMediaViewStore, usePlugin } from "../context";

export function usePlaylist() {
  const media = useMediaViewStore((s) => s.source?.url);
  const plugin = usePlugin();
  const [playlist, setPlaylist] = useState(() => plugin.playlist.get(media));
  useEffect(() => {
    function onPlaylistChange() {
      setPlaylist(plugin.playlist.get(media));
    }
    onPlaylistChange();
    plugin.app.metadataCache.on("mx-playlist-change", onPlaylistChange);
    return () => {
      plugin.app.metadataCache.off("mx-playlist-change", onPlaylistChange);
    };
  }, [media, plugin.playlist, plugin.app.metadataCache]);
  return playlist;
}
