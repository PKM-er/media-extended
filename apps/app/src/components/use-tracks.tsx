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
import { upperFirst } from "lodash-es";
import { useEffect, useMemo } from "react";
import type { TextTrackInfo, WebsiteTextTrack } from "@/info/track-info";
import { getTrackInfoID } from "@/info/track-info";
import { setDefaultLang } from "@/lib/lang/default-lang";
import { langCodeToLabel } from "@/lib/lang/lang";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import { useMediaViewStore, useSettings } from "./context";

export function useRemoteTextTracks() {
  // const externalTextTracks = useMediaViewStore(({ textTracks }) => textTracks);
  const player = useMediaPlayer();
  const loaded = useMediaState("canPlay");

  useEffect(() => {
    if (!player) return;
    const updateTrack = async (evt: TextTrackListModeChangeEvent) => {
      const track = evt.detail;
      const provider = player.provider;

      if (
        !(
          track.mode === "showing" &&
          track.content === dummyVTTContent &&
          track.id.startsWith(webpageTrackPrefix) &&
          provider instanceof WebiviewMediaProvider
        )
      )
        return;
      const id = (track.id as string).slice(webpageTrackPrefix.length);
      if (!loaded) {
        console.warn("Cannot load remote captions before media is loaded");
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
    player.textTracks.addEventListener("mode-change", updateTrack);
    return () => {
      player.textTracks.removeEventListener("mode-change", updateTrack);
    };
  }, [player, loaded]);
}

export function useTextTracks() {
  const localTextTracks = useMediaViewStore((s) => s.textTracks.local);
  const remoteTextTracks = useMediaViewStore((s) => s.textTracks.remote);
  const setRemoteTracks = useMediaViewStore((s) => s.updateWebsiteTracks);
  const defaultLang = useSettings((s) => s.defaultLanguage);
  const getDefaultLang = useSettings((s) => s.getDefaultLang);

  const provider = useMediaProvider();

  useEffect(() => {
    if (!(provider instanceof WebiviewMediaProvider)) return;
    return provider.media.on("mx-text-tracks", ({ payload: { tracks } }) => {
      setRemoteTracks(tracks);
      if (tracks.length !== 0) console.debug("Remote tracks loaded", tracks);
    });
  }, [provider, setRemoteTracks]);

  return useMemo(
    () => {
      const local = localTextTracks.map(
        (track) =>
          ({
            id: getTrackInfoID(track).id,
            kind: track.kind,
            label: track.label,
            type: track.type,
            content: track.content,
          } satisfies TextTrackInit),
      );
      const remote = dedupeWebsiteTrack(remoteTextTracks, localTextTracks).map(
        ({ wid, ...track }) =>
          ({
            id: webpageTrackPrefix + wid,
            ...track,
            content: dummyVTTContent,
          } satisfies TextTrackInit),
      );
      const tracks = [...local, ...remote].sort(sortTrack).map((t, idx) => ({
        ...t,
        label: toTrackLabel(t, idx),
      }));
      return setDefaultLang(tracks, getDefaultLang());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localTextTracks, remoteTextTracks, defaultLang],
  );
}

const webpageTrackPrefix = "webpage:";
export const dummyVTTContent = {
  cues: [],
  regions: [],
} satisfies VTTContent;

export function dedupeWebsiteTrack(
  website: WebsiteTextTrack[],
  local: TextTrackInfo[],
) {
  return website.filter((t) => !local.some(({ wid }) => wid === t.wid));
}

export function toTrackLabel(t: LabelProps, idx: number) {
  return (
    t.label ||
    langCodeToLabel(t.language) ||
    `${upperFirst(t.kind)} ${t.wid || idx + 1}`
  );
}

type LabelProps = Pick<TextTrackInfo, "label" | "language" | "kind" | "wid">;

export function sortTrack(a: LabelProps | null, b: LabelProps | null) {
  if (a && b) {
    // if with item.track.language, sort by item.track.language
    if (a.language && b.language) {
      return (a as { language: string }).language.localeCompare(
        (b as { language: string }).language,
      );
    }

    // if not with item.track.language, sort by item.label
    if (!a.language && !b.language) {
      return toTrackLabel(a, -1).localeCompare(toTrackLabel(b, -1));
    }

    // if one has language and the other doesn't, the one with language comes first
    if (a.language && !b.language) {
      return -1;
    }
    if (!a.language && b.language) {
      return 1;
    }
  }
  // if item.track is null, put it at the end
  if (a === null && b !== null) {
    return 1;
  }
  if (a !== null && b === null) {
    return -1;
  }
  return 0;
}
