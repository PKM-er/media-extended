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
    const tracks: ControlsState["captions"] = {
      list: [],
      active: -1,
      default: -1,
    };
    // console.group("track list " + name);
    for (let i = 0; i < trackList.length; i++) {
      const track = trackList[i];
      // console.log(track.language, track.mode, track);
      tracks.list.push({
        kind: track.kind,
        label: track.label,
        language: track.language,
        mode: track.mode,
      });
      if (tracks.default === -1 && isDefaultLang(track.language))
        tracks.default = i;
      if (tracks.active === -1 && track.mode === "showing") tracks.active = i;
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
