import type { PlayerComponent } from "@/media-view/base";
import { onPlayerMounted } from "../components/context";

export interface LastState {
  currentTime: number;
  playbackRate: number;
  paused: boolean;
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
