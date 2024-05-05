import { useMemoizedFn } from "ahooks";
import { useEffect, useMemo, useState } from "react";
import { compare } from "@/media-note/note-index/def";
import {
  findWithMedia,
  isWithMedia,
  type PlaylistWithActive,
} from "@/media-note/playlist/def";
import { useMediaViewStore, usePlaylistChange, usePlugin } from "../context";

export function usePlaylist(): PlaylistWithActive | undefined {
  const media = useMediaViewStore((s) => s.source?.url);
  const plugin = usePlugin();
  const [playlist, setPlaylist] = useState(() => plugin.playlist.get(media));
  useEffect(() => {
    function onPlaylistChange() {
      setPlaylist(plugin.playlist.get(media));
    }
    onPlaylistChange();
    plugin.app.metadataCache.on("mx:playlist-change", onPlaylistChange);
    return () => {
      plugin.app.metadataCache.off("mx:playlist-change", onPlaylistChange);
    };
  }, [media, plugin.playlist, plugin.app.metadataCache]);
  // get latest updated playlist
  return playlist.sort((a, b) => a.file.stat.mtime - b.file.stat.mtime).last();
}

export function useAutoContinuePlay() {
  const { target, action } = useJumpTo("next");
  const autoContinuePlay = usePlaylist()?.autoplay;
  const onEnded = useMemoizedFn(() => {
    if (!autoContinuePlay || !target) return;
    action();
  });
  return { onEnded };
}

export function useJumpTo(mode: "next" | "previous") {
  const onPlaylistChange = usePlaylistChange();
  const playlist = usePlaylist();
  const target = useMemo(() => {
    if (!playlist) return;
    const curr = playlist.list[playlist.active];
    if (!(curr && isWithMedia(curr))) return;
    const target = findWithMedia(
      playlist.list,
      (li) => !compare(curr.media, li.media),
      {
        fromIndex: mode === "next" ? playlist.active + 1 : playlist.active - 1,
        reverse: mode === "previous",
      },
    );
    if (!target) return;
    return target;
  }, [playlist, mode]);
  const action = useMemoizedFn(() => {
    if (!target || !playlist || !onPlaylistChange) return;
    onPlaylistChange(target, playlist);
  });
  return { target, action };
}
