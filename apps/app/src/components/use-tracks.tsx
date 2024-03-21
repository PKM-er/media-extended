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
import { Notice } from "obsidian";
import { useEffect, useMemo, useState } from "react";
import { MediaURL } from "@/info/media-url";
import { MediaHost } from "@/info/supported";
import { setDefaultLang } from "@/lib/lang/default-lang";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import { useMediaViewStore, usePlugin, useSettings } from "./context";

export function useRemoteTextTracks() {
  // const externalTextTracks = useMediaViewStore(({ textTracks }) => textTracks);
  const player = useMediaPlayer();
  const loaded = useMediaState("canPlay");
  // const textTrackCache = useCaptionCache();
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
          provider instanceof WebiviewMediaProvider
        )
      )
        return;
      const id = track.id as string;
      if (!loaded) {
        new Notice("Cannot load remote captions before media is loaded");
        return;
      }
      const vtt = await provider.media.methods.getTrack(id);
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
  }, [player, loaded]);
}

export function useBilibiliTextTracks() {
  const isBilibili = useMediaViewStore(
    ({ source }) =>
      source?.url instanceof MediaURL && source.url.type === MediaHost.Bilibili,
  );
  const plugin = usePlugin();
  const provider = useMediaProvider();
  const canPlay = useMediaState("canPlay");
  useEffect(() => {
    if (!isBilibili || !(provider instanceof WebiviewMediaProvider) || !canPlay)
      return;
    provider.media.methods.bili_getManifest().then(async (manifest) => {
      try {
        const reqUrl = await plugin.biliReq.getPlayerV2Request(manifest);
        provider.media.send("mx-bili-player-v2-url", reqUrl);
      } catch (e) {
        console.error("Failed to get player V2 API for bilibili", e);
      }
    });
  }, [plugin.biliReq, provider, isBilibili, canPlay]);
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

  const provider = useMediaProvider();
  useEffect(() => {
    if (!(provider instanceof WebiviewMediaProvider)) return;
    return provider.media.on("mx-text-tracks", ({ payload: { tracks } }) => {
      setRemoteTracks(
        tracks.map(({ src, ...t }) => ({ ...t, content: dummyVTTContent })),
      );
      if (tracks.length !== 0) console.debug("Remote tracks loaded", tracks);
    });
  }, [provider]);
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
