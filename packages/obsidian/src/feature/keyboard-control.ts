import { getMostRecentViewOfType } from "@misc";
import { AppDispatch } from "@player/store";
import type MediaExtended from "@plugin";
import { requestTimestamp, requsetScreenshot } from "@slice/action/thunk";
import { toggleMute, togglePlay } from "@slice/controls";
import { seekByOffset, setVolumeByOffest } from "@slice/controls/thunk";
import { Hotkey, KeymapEventHandler } from "obsidian";

import { MediaView } from "../media-view";
import { PlayerComponent } from "../media-view/common";

interface ControlAction {
  id: string;
  name: string;
  icon?: string;
  globalHotkeys?: Hotkey[];
  localHotkeys?: Hotkey[];
  action: Parameters<AppDispatch>[0];
}

const actions: ControlAction[] = [
  {
    id: "toggle-play",
    name: "Play/Pause",
    action: togglePlay(),
    localHotkeys: [{ key: " ", modifiers: [] }],
  },
  {
    id: "forward-5s",
    name: "Forward 5 second",
    action: seekByOffset(5),
    localHotkeys: [{ key: "ArrowRight", modifiers: [] }],
  },
  {
    id: "rewind-5s",
    name: "Rewind 5 second",
    action: seekByOffset(-5),
    localHotkeys: [{ key: "ArrowLeft", modifiers: [] }],
  },
  {
    id: "volume-up",
    name: "Volume Up by 5%",
    action: setVolumeByOffest(5),
    localHotkeys: [{ key: "ArrowUp", modifiers: [] }],
  },
  {
    id: "volume-down",
    name: "Volume Down by 5%",
    action: setVolumeByOffest(-5),
    localHotkeys: [{ key: "ArrowDown", modifiers: [] }],
  },
  {
    id: "toggle-mute",
    name: "Mute/Unmute",
    action: toggleMute(),
    localHotkeys: [{ key: "m", modifiers: [] }],
  },
  {
    id: "get-timestamp",
    name: "Get timestamp from active player",
    action: requestTimestamp(),
    // https://github.com/aidenlx/media-extended/issues/33
    globalHotkeys: [{ key: ";", modifiers: ["Mod"] }],
    localHotkeys: [{ key: ";", modifiers: [] }],
  },
  {
    id: "take-screenshot",
    name: "Take screenshot from active player",
    action: requsetScreenshot(),
    localHotkeys: [{ key: "s", modifiers: [] }],
  },
];

export const registerGlobalControlCmd = (plugin: MediaExtended) => {
  for (const { id, name, globalHotkeys, action } of actions) {
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
};

export const getPlayerKeymaps = (component: PlayerComponent) =>
  actions.reduce<KeymapEventHandler[]>((handlers, { localHotkeys, action }) => {
    if (!localHotkeys) return handlers;
    for (const { modifiers, key } of localHotkeys) {
      handlers.push(
        component.scope.register(modifiers, key, () => {
          component.store.dispatch(action);
        }),
      );
    }
    return handlers;
  }, []);
