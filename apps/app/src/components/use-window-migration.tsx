import type { PlayerComponent } from "@/media-view/base";
import { onPlayerMounted } from "./context";

export interface LastState {
  win: Window | undefined;
  currentTime: number;
  playbackRate: number;
  paused: boolean;
}

export function handleWindowMigration<
  T extends PlayerComponent & { containerEl: HTMLElement },
>(this: T, onWindowMigrated: (this: T) => void) {
  let lastState: LastState | null = null;
  this.register(
    onPlayerMounted(this.store, (player) => [
      player.subscribe(({ currentTime, paused, playbackRate }) => {
        if (currentTime === 0) return;
        lastState = {
          win: player.el?.win,
          currentTime,
          paused,
          playbackRate,
        };
      }),
      player.listen("can-play", (evt) => {
        if (!lastState || lastState.win === evt.target.el?.win) return;
        const { currentTime, paused, playbackRate } = lastState;
        const player = evt.target;
        player.currentTime = currentTime;
        player.playbackRate = playbackRate;
        if (!paused) player.play(new Event("recover-state"));
        lastState = null;
      }),
      player.listen("source-change", (evt) => {
        // if during window migration, don't reset state
        if (lastState?.win !== evt.target.el?.win) return;
        lastState = null;
      }),
    ]),
  );
  this.register(this.containerEl.onWindowMigrated(onWindowMigrated));
}
