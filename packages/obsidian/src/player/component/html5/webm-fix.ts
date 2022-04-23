import { PlayerStore } from "@player/store";
import { LARGE_CURRENT_TIME } from "@slice/controls";
import { switchToAudio, unknownTypeDetermined } from "@slice/provider/thunk";

const hookStoreToHTMLPlayer = (
  player: HTMLMediaElement,
  store: PlayerStore,
) => {
  const handler = () => {
    // useWebmFixes
    // if webm audio-only, switch to audio
    if (
      player instanceof HTMLVideoElement &&
      (player.videoHeight === 0 || player.videoWidth === 0)
    ) {
      store.dispatch(switchToAudio());
    } else {
      store.dispatch(unknownTypeDetermined());
    }
    // https://www.bugs.cc/p/webm-progress-bar-problem-and-solution/
    if (!player.duration || player.duration === Infinity) {
      player.addEventListener("timeupdate", () => (player.currentTime = 0), {
        once: true,
      });
      player.currentTime = LARGE_CURRENT_TIME;
    }
  };
  player.addEventListener("loadedmetadata", handler);
  return () => {
    player.removeEventListener("loadedmetadata", handler);
  };
};

export default hookStoreToHTMLPlayer;
