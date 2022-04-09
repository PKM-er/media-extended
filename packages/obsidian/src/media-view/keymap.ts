import { seekByOffset, setVolumeByOffest, togglePlay } from "@slice/controls";
import { KeymapEventHandler, KeymapEventListener, Scope } from "obsidian";

import { PlayerComponent } from "./view";

const getPlayerKeymaps = (component: PlayerComponent): KeymapEventHandler[] => {
  const toRegister: [key: string | null, func: KeymapEventListener][] = [
    ["ArrowRight", () => component.store.dispatch(seekByOffset(5))],
    ["ArrowLeft", () => component.store.dispatch(seekByOffset(-5))],
    ["ArrowUp", () => component.store.dispatch(setVolumeByOffest(5))],
    ["ArrowDown", () => component.store.dispatch(setVolumeByOffest(-5))],
    [" ", () => component.store.dispatch(togglePlay)],
  ];
  return toRegister.map(([key, func]) =>
    component.scope.register([], key, (evt, ctx) => func(evt, ctx) ?? false),
  );
};

export default getPlayerKeymaps;
