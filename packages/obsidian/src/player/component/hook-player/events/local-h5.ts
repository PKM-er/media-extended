import { isDefaultLang } from "@feature/subtitle";
import type { PlayerStore } from "@player/store";
import { handleTrackListChange } from "@slice/controls";
import type { ControlsState } from "@slice/controls/slice";
import { debounce } from "obsidian";

import _hookHTMLEvents from "./html5";

export const hookHTMLEvents = (
  player: HTMLMediaElement,
  store: PlayerStore,
) => {
  applyCaptionUpdate(player, store);
  return _hookHTMLEvents(player, store);
};

const applyCaptionUpdate = (player: HTMLMediaElement, store: PlayerStore) => {
  const trackList = player.textTracks;
  let handleTrackUpdate = (name: string) => {
    const prevActive = store.getState().controls.captions.active;
    let tracks: ControlsState["captions"] = {
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
      if (tracks.active === -1 && track.mode === "showing") {
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

  handleTrackUpdate = debounce(handleTrackUpdate, 50, true);
  trackList.onaddtrack = () => handleTrackUpdate("add");
  trackList.onremovetrack = () => handleTrackUpdate("remove");
  trackList.onchange = () => handleTrackUpdate("change");
  handleTrackUpdate("init");
};

const coalescing = (...args: number[]) => {
  for (const num of args) {
    if (num >= 0) return num;
  }
  return -1;
};
