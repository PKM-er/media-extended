import type { Component, View } from "obsidian";
import type { PlayerComponent } from "@/media-view/base";
import { onPlayerMounted } from "../components/context";

export interface LastState {
  currentTime: number;
  playbackRate: number;
  paused: boolean;
}

declare module "obsidian" {
  interface WorkspaceLeaf {
    parent: Component;
  }
}

export function handlePaneMigration<T extends PlayerComponent & View>(
  playerComp: T,
  onMigrated: () => void,
) {
  const lastStateStore = new WeakMap<Component, LastState>();
  let prevParent: Component | undefined;
  playerComp.register(
    onPlayerMounted(playerComp.store, (player) => {
      return [
        player.subscribe(({ currentTime, paused, playbackRate }) => {
          if (currentTime === 0) return;
          if (!player.el) return;
          lastStateStore.set(playerComp.leaf.parent, {
            currentTime,
            paused,
            playbackRate,
          });
        }),
        player.listen("can-play", () => {
          if (!prevParent) return;
          const lastState = lastStateStore.get(prevParent);
          if (!lastState) {
            prevParent = undefined;
            return;
          }
          const { currentTime, paused, playbackRate } = lastState;
          if (!paused) {
            player
              .play(new Event("recover-state"))
              .then(() => {
                player.currentTime = currentTime;
                player.playbackRate = playbackRate;
                if (prevParent) {
                  lastStateStore.delete(prevParent);
                  prevParent = undefined;
                }
              })
              .catch((e) => console.error("recov err play", e));
          } else {
            try {
              player.currentTime = currentTime;
              player.playbackRate = playbackRate;
              if (prevParent) {
                lastStateStore.delete(prevParent);
                prevParent = undefined;
              }
            } catch (e) {
              console.error("recov err paused", e);
            }
          }
        }),
      ];
    }),
  );
  playerComp.register(
    onParentMigrated(playerComp, (_, prev) => {
      onMigrated();
      if (lastStateStore.has(prev)) {
        prevParent = prev;
      } else {
        prevParent = undefined;
      }
    }),
  );
  playerComp.register(() => {
    prevParent = undefined;
  });
}

export function handleWindowMigration<
  T extends PlayerComponent & {
    containerEl: HTMLElement;
  },
>(playerComp: T, onMigrated: () => void) {
  const lastStateStore = new WeakMap<Window, LastState>();
  let prevWin: Window | undefined;
  playerComp.register(
    onPlayerMounted(playerComp.store, (player) => {
      return [
        player.subscribe(({ currentTime, paused, playbackRate }) => {
          if (currentTime === 0) return;
          if (!player.el) return;
          lastStateStore.set(player.el.win, {
            currentTime,
            paused,
            playbackRate,
          });
        }),
        player.listen("can-play", () => {
          if (!prevWin) return;
          const lastState = lastStateStore.get(prevWin);
          if (!lastState) {
            prevWin = undefined;
            return;
          }
          const { currentTime, paused, playbackRate } = lastState;
          if (!paused) {
            player
              .play(new Event("recover-state"))
              .then(() => {
                player.currentTime = currentTime;
                player.playbackRate = playbackRate;
                if (prevWin) {
                  lastStateStore.delete(prevWin);
                  prevWin = undefined;
                }
              })
              .catch((e) => console.error("recov err play", e));
          } else {
            try {
              player.currentTime = currentTime;
              player.playbackRate = playbackRate;
              if (prevWin) {
                lastStateStore.delete(prevWin);
                prevWin = undefined;
              }
            } catch (e) {
              console.error("recov err paused", e);
            }
          }
        }),
      ];
    }),
  );
  playerComp.register(
    onWindowMigrated(playerComp.containerEl, (_, prev) => {
      onMigrated();
      if (lastStateStore.has(prev)) {
        prevWin = prev;
      } else {
        prevWin = undefined;
      }
    }),
  );
  playerComp.register(() => {
    prevWin = undefined;
  });
}

function onWindowMigrated(
  target: HTMLElement,
  handler: (win: Window, prevWin: Window) => void,
) {
  let prevWin = target.win;
  return target.onNodeInserted(() => {
    const currWin = target.win;
    if (currWin === prevWin) return;
    handler(currWin, prevWin);
    prevWin = currWin;
  });
}
function onParentMigrated(
  view: View,
  handler: (curr: Component, prev: Component) => void,
) {
  let prevWin = view.containerEl.win;
  let prevTab = view.leaf.parent;
  return view.containerEl.onNodeInserted(() => {
    const currWin = view.containerEl.win;
    const currLeaf = view.leaf.parent;
    if (currWin === prevWin) {
      if (currLeaf !== prevTab) {
        console.log("currLeaf", currLeaf, "prevLeaf", prevTab);
        handler(currLeaf, prevTab);
        prevTab = currLeaf;
      }
    } else {
      prevWin = currWin;
    }
  });
}
