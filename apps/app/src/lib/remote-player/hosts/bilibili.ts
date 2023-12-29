import type { CommRemote } from "@/lib/remote-player/type";
import { playReadyEvent } from "@/lib/remote-player/type";
import { waitForSelector } from "@/lib/remote-player/utils/wait-el";
import { bindPlayer } from "../bind";

await Promise.all([
  waitForSelector<HTMLVideoElement>("#bilibili-player video"),
  MX_MESSAGE as Promise<CommRemote>,
]).then(async ([player, port]) => {
  bindPlayer(player, port);
  player.addEventListener(
    "canplay",
    async () => {
      const playerEl =
        document.querySelector<HTMLDivElement>("#bilibili-player");
      if (!playerEl) return;

      const danmakuSwitchEl = await waitForSelector<HTMLDivElement>(
        ".bui-danmaku-switch",
        playerEl,
      );
      // if danmaku is on (by checking if label is hidden)
      if (
        danmakuSwitchEl.querySelector<HTMLDivElement>(".bui-danmaku-switch-off")
          ?.offsetHeight === 0
      ) {
        const danmakuButton = danmakuSwitchEl.querySelector<HTMLInputElement>(
          "input.bui-danmaku-switch-input",
        );
        if (!danmakuButton) {
          console.error("danmaku button not found");
        } else {
          danmakuButton.click();
        }
      }

      // enter web fullscreen
      if (!playerEl.classList.contains("mode-webscreen")) {
        const webFullscreenButton = await waitForSelector<HTMLDivElement>(
          "div.bpx-player-ctrl-btn.bpx-player-ctrl-web",
          playerEl,
        );
        webFullscreenButton.click();
        // wait for playerEl to have class mode-webscreen
        await untilWebFullscreen(playerEl);
      }
      port.send(playReadyEvent, void 0);
    },
    { once: true },
  );
});

async function untilWebFullscreen(playerEl: HTMLDivElement) {
  await new Promise((resolve) => {
    const observer = new MutationObserver((mutations) => {
      const mutation = mutations.find(
        (m) =>
          m.type === "attributes" &&
          m.attributeName === "class" &&
          playerEl?.classList.contains("mode-webscreen"),
      );
      if (mutation) {
        observer.disconnect();
        resolve(undefined);
      }
    });
    observer.observe(playerEl, { attributes: true });
    // timeout after 2 seconds
    setTimeout(() => {
      observer.disconnect();
      resolve(undefined);
    }, 2e3);
  });
}
