import { getMostRecentViewOfType } from "@misc/obsidian";
import type MediaExtended from "@plugin";
import { MediaView, PlayerComponent } from "@view";
import { requestTimestamp, requsetScreenshot } from "mx-store";
import {
  setPlaybackRate,
  setVolumeByOffest,
  toggleMute,
  togglePlay,
} from "mx-store";
import { AppDispatch } from "mx-store";
import { Hotkey } from "obsidian";

import { globalRepeat, localRepeat } from "./repeat";

interface ControlAction {
  id: string;
  name: string;
  icon?: string;
  globalHotkeys?: Hotkey[];
  localHotkeys?: Hotkey[];
  action: (dispatch: AppDispatch) => any;
}

const getActions = (plugin: MediaExtended): ControlAction[] => {
  return [
    {
      id: "toggle-play",
      name: "Play/Pause",
      action: (dispatch) => dispatch(togglePlay()),
      localHotkeys: [{ key: " ", modifiers: [] }],
    },
    {
      id: "volume-up",
      name: "Volume Up by 5%",
      action: (dispatch) => dispatch(setVolumeByOffest(5)),
      localHotkeys: [{ key: "ArrowUp", modifiers: [] }],
    },
    {
      id: "volume-down",
      name: "Volume Down by 5%",
      action: (dispatch) => dispatch(setVolumeByOffest(-5)),
      localHotkeys: [{ key: "ArrowDown", modifiers: [] }],
    },
    {
      id: "toggle-mute",
      name: "Mute/Unmute",
      action: (dispatch) => dispatch(toggleMute()),
      localHotkeys: [{ key: "m", modifiers: [] }],
    },
    {
      id: "get-timestamp",
      name: "Get timestamp from active player",
      action: (dispatch) => dispatch(requestTimestamp()),
      // https://github.com/aidenlx/media-extended/issues/33
      globalHotkeys: [{ key: ";", modifiers: ["Mod"] }],
      localHotkeys: [{ key: ";", modifiers: [] }],
    },
    {
      id: "take-screenshot",
      name: "Take screenshot from active player",
      action: (dispatch) => dispatch(requsetScreenshot()),
      localHotkeys: [{ key: "s", modifiers: [] }],
    },
    ...[0.5, 1, 1.25, 1.5, 2, 4].map(
      (speed, index): ControlAction => ({
        id: `speed-${speed}`,
        name: `${speed}× Playback`,
        action: (dispatch) => dispatch(setPlaybackRate(speed)),
        localHotkeys: [
          { key: index === 0 ? "`" : index.toString(), modifiers: [] },
        ],
      }),
    ),
  ];
};

export const registerCommand = (plugin: MediaExtended) => {
  for (const { id, name, globalHotkeys, action } of getActions(plugin)) {
    plugin.addCommand({
      id,
      name,
      checkCallback: (checking) => {
        let view = getMostRecentViewOfType(MediaView);
        if (checking) {
          return !!view;
        } else if (view) {
          view.store.dispatch(action);
        }
      },
      hotkeys: globalHotkeys,
    });
  }
  globalRepeat(plugin);
};

export const registerScope = (component: PlayerComponent) => {
  for (const { localHotkeys, action } of getActions(component.plugin)) {
    if (!localHotkeys) continue;
    for (const { modifiers, key } of localHotkeys) {
      component.registerScopeEvent(
        component.scope.register(modifiers, key, (evt) => {
          evt.preventDefault();
          component.store.dispatch(action);
        }),
      );
    }
  }
  localRepeat(component);
};
