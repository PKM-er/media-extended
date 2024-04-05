import {
  useMediaPlayer,
  useMediaProvider,
  useMediaState,
} from "@vidstack/react";
import type {
  TextTrackInit,
  TextTrackListModeChangeEvent,
  VTTContent,
} from "@vidstack/react";
import { useEffect, useMemo, useState } from "react";
import { setDefaultLang } from "@/lib/lang/default-lang";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import { toInfoKey } from "@/media-note/note-index/def";
import { useMediaViewStore, usePlugin, useSettings } from "./context";

function useSid() {
  return useMediaViewStore((s) => (s.source ? toInfoKey(s.source.url) : null));
}

export function useRemoteTextTracks() {
  // const externalTextTracks = useMediaViewStore(({ textTracks }) => textTracks);
  const player = useMediaPlayer();
  const loaded = useMediaState("canPlay");
  const sid = useSid();
  const plugin = usePlugin();

  useEffect(() => {
    if (!player) return;
    const updateCaption = async (evt: TextTrackListModeChangeEvent) => {
      const track = evt.detail;
      const provider = player.provider;

      if (
        !(
          track.mode === "showing" &&
          track.content === dummyVTTContent &&
          track.id &&
          provider instanceof WebiviewMediaProvider &&
          sid
        )
      )
        return;
      const id = track.id as string;
      const cached = await plugin.cacheStore.getCaption(sid, id);
      let vtt;
      if (cached) {
        vtt = cached.content;
        console.debug("Caption data loaded from cache", sid, id);
      } else {
        if (!loaded) {
          console.warn("Cannot load remote captions before media is loaded");
          return;
        }
        vtt = await provider.media.methods.getTrack(id);
        plugin.cacheStore.updateCaption(sid, id, vtt).then((v) => {
          if (v) {
            console.debug("Caption cached", sid, id);
          } else {
            console.error("Cannot cache caption", sid, id);
          }
        });
      }
      if (!vtt) return;
      player.textTracks.remove(track);
      player.textTracks.add({
        content: vtt,
        kind: track.kind,
        default: track.default,
        encoding: track.encoding,
        id: track.id,
        label: track.label,
        language: track.language,
        type: track.type,
      });
      player.textTracks.getById(id)?.setMode("showing");
    };
    player.textTracks.addEventListener("mode-change", updateCaption);
    return () => {
      player.textTracks.removeEventListener("mode-change", updateCaption);
    };
  }, [player, loaded, sid, plugin.cacheStore]);
}

export function useTextTracks() {
  const localTextTracks = useMediaViewStore(({ textTracks }) => textTracks);
  const [remoteTextTracks, setRemoteTracks] = useState<
    (TextTrackInit & {
      id: string;
    })[]
  >([]);
  const defaultLang = useSettings((s) => s.defaultLanguage);
  const getDefaultLang = useSettings((s) => s.getDefaultLang);
  const sid = useSid();
  const plugin = usePlugin();

  const provider = useMediaProvider();
  useEffect(() => {
    if (!sid) return;
    plugin.cacheStore.getCaptions(sid).then((data) => {
      if (data.length === 0) return;
      setRemoteTracks(
        data.map(({ sid, data, ...info }) => ({
          ...info,
          content: dummyVTTContent,
        })),
      );
      console.debug("Remote tracks loaded from cache", data.length);
    });
  }, [plugin.cacheStore, sid]);
  useEffect(() => {
    if (!(provider instanceof WebiviewMediaProvider)) return;
    return provider.media.on("mx-text-tracks", ({ payload: { tracks } }) => {
      setRemoteTracks(
        tracks.map(({ src, ...t }) => ({ ...t, content: dummyVTTContent })),
      );
      if (tracks.length !== 0) console.debug("Remote tracks loaded", tracks);
    });
  }, [provider]);
  useEffect(() => {
    if (!(provider instanceof WebiviewMediaProvider) || !sid) return;
    return provider.media.on(
      "mx-text-tracks",
      async ({ payload: { tracks } }) => {
        await plugin.cacheStore.saveCaptionList(sid, tracks);
        if (tracks.length !== 0)
          console.debug("Remote tracks cached", tracks.length);
      },
    );
  }, [plugin.cacheStore, provider, sid]);
  return useMemo(
    () =>
      setDefaultLang(
        [...localTextTracks, ...remoteTextTracks],
        getDefaultLang(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localTextTracks, remoteTextTracks, defaultLang],
  );
}

export const dummyVTTContent = {
  cues: [],
  regions: [],
} satisfies VTTContent;
