import "obsidian";

import { getMostRecentViewOfType } from "@misc/obsidian";
import type MediaExtended from "@plugin";
import { AnyAction } from "@reduxjs/toolkit";
import { MediaView, PlayerComponent } from "@view";
import { around } from "monkey-around";
import { seekByOffset } from "mx-player";
import { AppThunk, setPlaybackRate } from "mx-store";
import { keyboardSeek, keyboardSeekEnd } from "mx-store";
import { Hotkey } from "obsidian";

declare module "obsidian" {
  interface HotkeyManager {
    onTrigger: (evt: KeyboardEvent, hotkey: any) => true | void;
  }
  interface Scope {
    keys: {
      func: Function;
    }[];
  }
  interface App {
    hotkeyManager: HotkeyManager;
  }
}

let activeHotkey: KeyboardEvent | null = null;

type RepeatActions = Record<
  "regular" | "repeat" | "repeatDone",
  AppThunk | AnyAction
>;
type GetRepeatActions = (plugin: MediaExtended) => RepeatActions;

const repeatActions: {
  id: string;
  name: string;
  globalHotkeys?: Hotkey[];
  localHotkeys?: Hotkey[];
  getAction: GetRepeatActions;
}[] = [
  {
    id: "forward",
    name: "Forward",
    localHotkeys: [{ key: "ArrowRight", modifiers: [] }],
    getAction: (plugin) => {
      const { fastForwardRate, forwardStep } = plugin.settings.controls;
      return {
        regular: seekByOffset(forwardStep),
        repeat: setPlaybackRate(fastForwardRate),
        // TODO: revert to previous rate
        repeatDone: setPlaybackRate(1),
      };
    },
  },
  {
    id: "rewind",
    name: "Rewind",
    localHotkeys: [{ key: "ArrowLeft", modifiers: [] }],
    getAction: (plugin) => {
      const { rewindStep } = plugin.settings.controls;
      return {
        regular: seekByOffset(-rewindStep),
        repeat: keyboardSeek(-rewindStep),
        repeatDone: keyboardSeekEnd(),
      };
    },
  },
];

interface RepeatConfig {
  repeatWait: number;
  repeatInterval: number;
}
const repeatConfig: RepeatConfig = {
  repeatWait: 250,
  repeatInterval: 80,
};

const handleRepeat = (
  isHotkey: boolean,
  component: PlayerComponent,
  getAction: GetRepeatActions,
  { repeatInterval, repeatWait }: RepeatConfig = repeatConfig,
) => {
  if (!isHotkey) return;
  const { regular, repeat } = getAction(component.plugin);
  let timeoutId = -1, // >=0: repeat is waiting to be triggered
    intervalId = -1; //  >=0: repeat is active
  const cancel = () => {
    // cancel repeat request
    window.clearTimeout(timeoutId);
    // cancel repeating
    window.clearInterval(intervalId);
  };
  window.addEventListener(
    "keyup",
    (evt) => {
      evt.preventDefault();
      cancel();
      if (intervalId > 0) {
        const { repeatDone } = getAction(component.plugin);
        component.store.dispatch(repeatDone);
      } else {
        component.store.dispatch(regular);
      }
      intervalId = -1;
    },
    { once: true },
  );
  component.register(cancel);
  timeoutId = window.setTimeout(() => {
    intervalId = window.setInterval(() => {
      component.store.dispatch(repeat);
    }, repeatInterval);
    timeoutId = -1;
  }, repeatWait);
};

export const globalRepeat = (plugin: MediaExtended) => {
  //#region  hacky way to watch hotkey manger to see if command is triggered by hotkey
  // https://github.com/obsidianmd/obsidian-api/issues/67
  plugin.register(
    around(app.scope.keys[0], {
      func:
        (next) =>
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        (evt: KeyboardEvent, hotkey: any, ...args: any[]) => {
          if (evt instanceof KeyboardEvent) {
            activeHotkey = evt;
            const result = next(evt, hotkey, ...args);
            activeHotkey = null;
            return result;
          } else {
            console.error(
              "patched key handler not from hotkey manager, fallback to default",
              evt,
              hotkey,
            );
            return next(evt, hotkey, ...args);
          }
        },
    }),
  );
  //#endregion
  for (const { id, name, getAction, globalHotkeys } of repeatActions) {
    plugin.addCommand({
      id,
      name,
      checkCallback: (checking) => {
        let view = getMostRecentViewOfType(MediaView);
        if (checking) {
          return !!view;
        } else if (view) {
          handleRepeat(!!activeHotkey, view, getAction);
        }
      },
      hotkeys: globalHotkeys,
      repeatable: false,
    });
  }
};

export const localRepeat = (component: PlayerComponent) => {
  for (const { localHotkeys, getAction } of repeatActions) {
    if (!localHotkeys) continue;
    for (const { modifiers, key } of localHotkeys) {
      component.registerScopeEvent(
        component.scope.register(modifiers, key, (evt) => {
          evt.preventDefault();
          if (!evt.repeat) {
            handleRepeat(true, component, getAction);
          }
        }),
      );
    }
  }
};