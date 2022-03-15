import type { MediaProviderElement } from "@aidenlx/player";
import { KeymapEventHandler, KeymapEventListener, Scope } from "obsidian";

const getPlayerKeymaps = (
  scope: Scope,
  player: MediaProviderElement,
): KeymapEventHandler[] => {
  const forward = (second: number) => {
      player.currentTime += second;
    },
    volumeUp = (percent: number) => {
      player.volume += percent;
    },
    togglePlay = () => (player.paused ? player.play() : player.pause());
  const toRegister: [key: string | null, func: KeymapEventListener][] = [
    ["ArrowRight", () => forward(5)],
    ["ArrowLeft", () => forward(-5)],
    ["ArrowUp", () => volumeUp(0.1)],
    ["ArrowDown", () => volumeUp(-0.1)],
    [" ", togglePlay],
  ];
  return toRegister.map(([key, func]) =>
    scope.register([], key, (evt, ctx) => func(evt, ctx) ?? false),
  );
};
export default getPlayerKeymaps;
