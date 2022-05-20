import { isDefaultLang } from "@feature/subtitle/default-lang";
import {
  Controls,
  handleTrackListChange,
  InterfaceState,
} from "@slice/interface";
import { updateCues } from "@slice/interface";
import { PlayerStore, selectIsCustomControls } from "@store";
import { debounce } from "lodash-es";

import _hookHTMLEvents from "./html5";

export const hookHTMLEvents = (
  player: HTMLMediaElement,
  store: PlayerStore,
) => {
  const toUnload = [
    hookTracksUpdate(player, store),
    hookCueUpdate(player, store),
    _hookHTMLEvents(player, store),
  ];
  return () => toUnload.forEach((unload) => unload());
};

const hookTracksUpdate = (player: HTMLMediaElement, store: PlayerStore) => {
  const trackList = player.textTracks;
  let handleTrackUpdate = () => {
    const prevActive = store.getState().interface.textTracks.active;
    let tracks: InterfaceState["textTracks"] = {
      list: [],
      active: -1,
      enabled: false,
    };
    let defaultTrack = -1;
    // console.group("track list " + name);
    for (let i = 0; i < trackList.length; i++) {
      const track = trackList[i];
      // console.log(track.language, track.mode, track);
      tracks.list.push({
        kind: track.kind,
        label: track.label,
        language: track.language,
      });
      if (
        tracks.active === -1 &&
        (track.mode === "showing" || track.mode === "hidden")
      ) {
        tracks.active = i;
        tracks.enabled = true;
      }
      if (defaultTrack === -1 && isDefaultLang(track.language)) {
        defaultTrack = i;
      }
    }
    if (tracks.active === -1) {
      tracks.active = coalescing(
        prevActive,
        defaultTrack,
        tracks.list.length > 0 ? 0 : -1,
      );
    }
    // console.groupEnd();
    store.dispatch(handleTrackListChange(tracks));
  };

  const hideTracks = () => {
    const shouldHide = selectIsCustomControls(store.getState());
    for (let i = 0; i < trackList.length; i++) {
      const track = trackList[i];
      if (shouldHide && track.mode === "showing") {
        track.mode = "hidden";
      } else if (!shouldHide && track.mode === "hidden") {
        track.mode = "showing";
      }
    }
  };

  handleTrackUpdate = debounce(handleTrackUpdate, 50);
  trackList.addEventListener("addtrack", handleTrackUpdate);
  trackList.addEventListener("removetrack", handleTrackUpdate);
  trackList.addEventListener("change", handleTrackUpdate);
  handleTrackUpdate();
  trackList.addEventListener("addtrack", hideTracks);
  trackList.addEventListener("change", hideTracks);
  return () => {
    trackList.removeEventListener("addtrack", handleTrackUpdate);
    trackList.removeEventListener("removetrack", handleTrackUpdate);
    trackList.removeEventListener("change", handleTrackUpdate);
    trackList.removeEventListener("addtrack", hideTracks);
    trackList.removeEventListener("change", hideTracks);
  };
};

const toHTML = (frag: DocumentFragment) => {
  const div = document.createElement("div");
  div.append(frag);
  return div.innerHTML;
};
const hookCueUpdate = (player: HTMLMediaElement, store: PlayerStore) => {
  const trackList = player.textTracks;

  let active: TextTrack | null = null;
  const updateCue = () => {
    const activeCues = Array.from(active?.activeCues ?? []).map((cue) =>
      toHTML((cue as VTTCue).getCueAsHTML()),
    );
    store.dispatch(updateCues(activeCues));
  };
  const registerCueUpdate = (track: TextTrack) => {
      if (active) unregisterCueUpdate();
      active = track;
      track.addEventListener("cuechange", updateCue);
    },
    unregisterCueUpdate = () => {
      if (!active) return;
      active.removeEventListener("cuechange", updateCue);
      active = null;
    };

  const handleTrackUpdate = () => {
    for (let i = 0; i < trackList.length; i++) {
      const track = trackList[i];
      if (track.mode === "hidden" || track.mode === "showing") {
        registerCueUpdate(track);
        return;
      }
    }
    unregisterCueUpdate();
  };
  trackList.addEventListener("addtrack", handleTrackUpdate);
  trackList.addEventListener("removetrack", handleTrackUpdate);
  trackList.addEventListener("change", handleTrackUpdate);

  return () => {
    trackList.removeEventListener("addtrack", handleTrackUpdate);
    trackList.removeEventListener("removetrack", handleTrackUpdate);
    trackList.removeEventListener("change", handleTrackUpdate);
    unregisterCueUpdate();
  };
};

const coalescing = (...args: number[]) => {
  for (const num of args) {
    if (num >= 0) return num;
  }
  return -1;
};
