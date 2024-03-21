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
import { setDefaultLang } from "@/lib/lang/default-lang";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import { useMediaViewStore, useSettings } from "./context";

export function useRemoteTracks() {
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

export function useTracks() {
  const localTextTracks = useMediaViewStore(({ textTracks }) => textTracks);
  const [remoteTextTracks, setRemoteTracks] = useState<
    (TextTrackInit & {
      id: string;
    })[]
  >([]);
  const loaded = useMediaState("canPlay");
  const defaultLang = useSettings((s) => s.defaultLanguage);

  const provider = useMediaProvider();
  useEffect(() => {
    if (!(provider instanceof WebiviewMediaProvider) || !loaded) return;
    provider.media.methods.getTracks().then((tracks): void => {
      setRemoteTracks(
        tracks.map(({ src, ...t }) => ({ ...t, content: dummyVTTContent })),
      );
      if (tracks.length !== 0) console.debug("Remote tracks loaded", tracks);
    });
  }, [provider, loaded]);
  return useMemo(
    () =>
      setDefaultLang([...localTextTracks, ...remoteTextTracks], defaultLang),
    [localTextTracks, remoteTextTracks, defaultLang],
  );
}

export const dummyVTTContent = {
  cues: [],
  regions: [],
} satisfies VTTContent;
