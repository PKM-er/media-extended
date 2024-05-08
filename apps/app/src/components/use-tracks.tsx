import { useMediaPlayer, useMediaProvider, TextTrack } from "@vidstack/react";
import { upperFirst } from "lodash-es";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMediaInfoID } from "@/info/media-info";
import type { TextTrackInfo, WebsiteTextTrack } from "@/info/track-info";
import { getTrackInfoID } from "@/info/track-info";
import { getDefaultLang } from "@/lib/lang/default-lang";
import { langCodeToLabel } from "@/lib/lang/lang";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import { useMediaViewStore, useSettings } from "./context";

export function useLastSelectedTrack() {
  const key = useMediaViewStore((s) =>
    s.source?.url ? `mx-last-track:${getMediaInfoID(s.source.url)}` : null,
  );
  const [lastSelectedTrack, setTrack] = useState<string | null>(() =>
    key && window ? window.localStorage.getItem(key) : null,
  );
  useEffect(() => {
    () => {
      if (!key || !window) return;
      setTrack(window?.localStorage.getItem(key));
    };
  }, [key]);
  return [
    lastSelectedTrack === "" ? false : lastSelectedTrack,
    useCallback(
      (trackID: string | null) => {
        if (!key) return;
        if (!trackID) window?.localStorage.setItem(key, "");
        else window?.localStorage.setItem(key, trackID);
      },
      [key],
    ),
  ] as const;
}

function useDefaultLang() {
  const defaultLang = useSettings((s) => s.defaultLanguage);
  const getDefaultLang = useSettings((s) => s.getDefaultLang);
  return useMemo(
    () => getDefaultLang(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultLang],
  );
}
function useDefaultTrack() {
  // useDefaultShowingTrack();
  const [lastSelectedTrack] = useLastSelectedTrack();
  const defaultLang = useDefaultLang();
  const enableDefaultSubtitle = useSettings((s) => s.enableSubtitle);
  return useCallback(
    (
      ...tracks: { language?: string }[]
    ): ((
      track: { language?: string; id: string; wid?: string },
      index: number,
    ) => boolean) => {
      // if user has selected subtitle for this media
      if (lastSelectedTrack === false) return () => false;
      if (lastSelectedTrack) {
        const lastWid = getWebpageIDFromTrackID(lastSelectedTrack);
        return ({ id, wid }) => id === lastSelectedTrack || wid === lastWid;
      }
      // if user have enabled subtitle by default
      if (enableDefaultSubtitle) {
        const lang = getDefaultLang(tracks, defaultLang);
        if (!lang) return (_, index) => index === 0;
        return ({ language }) => language === lang;
      }
      return () => false;
    },
    [defaultLang, enableDefaultSubtitle, lastSelectedTrack],
  );
}

export function useTextTracks() {
  const localTracks = useMediaViewStore((s) => s.textTracks.local);
  const remoteTracks = useMediaViewStore((s) => s.textTracks.remote);
  const setRemoteTracks = useMediaViewStore((s) => s.updateWebsiteTracks);
  const provider = useMediaProvider();
  const genDefaultTrackPredicate = useDefaultTrack();

  useEffect(() => {
    if (!(provider instanceof WebiviewMediaProvider)) return;
    const providerCache = providerRef.current!;
    return provider.media.on("mx-text-tracks", ({ payload: { tracks } }) => {
      providerCache.set(tracks, provider);
      setRemoteTracks(tracks);
      if (tracks.length !== 0) console.debug("Remote tracks loaded", tracks);
    });
  }, [provider, setRemoteTracks]);

  const providerRef =
    useRef<WeakMap<WebsiteTextTrack[], WebiviewMediaProvider>>();
  providerRef.current ??= new WeakMap();

  const player = useMediaPlayer();

  useEffect(() => {
    if (!player) return;
    const provider = providerRef.current!.get(remoteTracks);
    const customFetch: typeof window.fetch = async (url, init) => {
      const id = getWebpageIDFromURL(url);
      if (!id) return fetch(url, init);
      if (!provider) return new Response(null, { status: 500 });
      const vtt = await provider.media.methods.getTrack(id);
      if (!vtt) return new Response(null, { status: 404 });
      return new Response(JSON.stringify(vtt), {
        headers: { "Content-Type": "application/json" },
      });
    };

    const defaultTrackPredicate = genDefaultTrackPredicate(
      ...localTracks,
      ...remoteTracks,
    );

    const local = localTracks.map((track, i) => {
      const { wid, src, ...props } = track;
      const id = getTrackInfoID(track).id;
      const isDefault = defaultTrackPredicate(
        { id, language: props.language, wid },
        i,
      );
      const out = new TextTrack({
        ...props,
        id,
        default: isDefault,
      });
      // out.setMode(isDefault ? "showing" : "disabled");
      return out;
    });
    const remote = dedupeWebsiteTrack(remoteTracks, localTracks).map(
      ({ wid, ...props }, i) => {
        const id = toWebpageID(wid);
        const isDefault = defaultTrackPredicate(
          { id, language: props.language, wid },
          i + localTracks.length,
        );
        const track = new TextTrack({
          ...props,
          id,
          type: "json",
          src: toWebpageUrl(wid),
          default: isDefault,
        });
        // track.setMode(isDefault ? "showing" : "disabled");
        track.customFetch = customFetch;
        return track;
      },
    );

    player.textTracks.clear();
    // @ts-expect-error may report to vidstack/react as a bug?
    player.textTracks._defaults = {};
    [...local, ...remote].sort(sortTrack).forEach((track, i) => {
      // @ts-expect-error I know it's readonly
      track.label = toTrackLabel(track, i);
      player.textTracks.add(track);
    });
  }, [genDefaultTrackPredicate, player, localTracks, remoteTracks]);
  // const defaultLang = useSettings((s) => s.defaultLanguage);
  // const getDefaultLang = useSettings((s) => s.getDefaultLang);
  // useDefaultShowingTrack();
}

const webpageTrackPrefix = "webpage:";

function toWebpageID(wid: string) {
  return webpageTrackPrefix + wid;
}
function toWebpageUrl(wid: string) {
  return `webview://${toWebpageID(wid)}`;
}
function getWebpageIDFromTrackID(id: string) {
  if (!id.startsWith(webpageTrackPrefix)) return null;
  return id.slice(webpageTrackPrefix.length);
}
function getWebpageIDFromURL(url: unknown) {
  if (typeof url !== "string" || !url.startsWith("webview://")) return null;
  return url.slice(`webview://${webpageTrackPrefix}`.length);
}

export function dedupeWebsiteTrack(
  website: WebsiteTextTrack[],
  local: TextTrackInfo[],
) {
  return website.filter((t) => !local.some(({ wid }) => wid === t.wid));
}

interface SortableTrack {
  language?: string;
  label?: string;
  kind: string;
}

export function toTrackLabel(t: SortableTrack, idx: number) {
  return (
    t.label || langCodeToLabel(t.language) || `${upperFirst(t.kind)} ${idx + 1}`
  );
}

export function sortTrack(a: SortableTrack | null, b: SortableTrack | null) {
  if (a && b) {
    // if with item.track.language, sort by item.track.language
    if (a.language && b.language) {
      return (a.language as string).localeCompare(b.language as string);
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
