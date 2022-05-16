import { getMostRecentViewOfType } from "@misc";
import { AppDispatch, PlayerStore } from "@player/store";
import type MediaExtended from "@plugin";
import { requestTimestamp, requsetScreenshot } from "@slice/action/thunk";
import {
  keyboardSeek,
  keyboardSeekEnd,
  toggleMute,
  togglePlay,
} from "@slice/controls";
import {
  seekByOffset,
  setPlaybackRate,
  setVolumeByOffest,
} from "@slice/controls/thunk";
import { Component, debounce, Hotkey } from "obsidian";

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

const getActions: (plugin: MediaExtended) => ControlAction[] = (plugin) => {
  const { forwardStep, rewindStep } = plugin.settings.controls;
  return [
    {
      id: "toggle-play",
      name: "Play/Pause",
      action: togglePlay(),
      localHotkeys: [{ key: " ", modifiers: [] }],
    },
    {
      id: "forward-5s",
      name: "Forward 5 second",
      action: seekByOffset(forwardStep),
      // localHotkeys: [{ key: "ArrowRight", modifiers: [] }],
    },
    {
      id: "rewind-5s",
      name: "Rewind 5 second",
      action: seekByOffset(-rewindStep),
      // localHotkeys: [{ key: "ArrowLeft", modifiers: [] }],
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
    ...[0.5, 1, 1.25, 1.5, 2, 4].map((speed, index) => ({
      id: `speed-${speed}`,
      name: `${speed}× Playback`,
      action: setPlaybackRate(speed),
      localHotkeys: [
        { key: index === 0 ? "`" : index.toString(), modifiers: [] },
      ],
    })),
  ];
};

export const registerGlobalControlCmd = (plugin: MediaExtended) => {
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
};

export const setPlayerKeymaps = (component: PlayerComponent) => {
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
  localForward(component);
};

const getRepeatHandler = (
  component: Component,
  store: PlayerStore,
  {
    regular,
    repeat,
    repeatDone,
  }: Record<"regular" | "repeat" | "repeatDone", Parameters<AppDispatch>[0]>,
) => {
  let repeated = false;
  let handler: (() => any) | undefined;
  component.register(
    () => handler && window.removeEventListener("keyup", handler),
  );
  return (evt: KeyboardEvent) => {
    evt.preventDefault();
    if (!handler) {
      handler = () => {
        if (repeated) {
          store.dispatch(repeatDone);
          repeated = false;
        }
        handler && window.removeEventListener("keyup", handler);
        handler = undefined;
      };
      window.addEventListener("keyup", handler);
    }
    if (!evt.repeat) {
      store.dispatch(regular);
    } else {
      store.dispatch(repeat);
      repeated = true;
    }
  };
};

const localForward = (component: PlayerComponent) => {
  const { fastForwardRate, forwardStep, rewindStep } =
    component.plugin.settings.controls;
  const forwardActions = {
      regular: seekByOffset(forwardStep),
      repeat: setPlaybackRate(fastForwardRate),
      // TODO: revert to previous rate
      repeatDone: setPlaybackRate(1),
    },
    rewindActions = {
      regular: seekByOffset(rewindStep),
      repeat: keyboardSeek(-rewindStep),
      repeatDone: keyboardSeekEnd(),
    };
  component.registerScopeEvent(
    component.scope.register(
      [],
      "ArrowRight",
      getRepeatHandler(component, component.store, forwardActions),
    ),
  );
  component.registerScopeEvent(
    component.scope.register(
      [],
      "ArrowLeft",
      getRepeatHandler(component, component.store, rewindActions),
    ),
  );
};
