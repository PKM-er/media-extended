import { PlayerContainerID, PlayerPlaceholderID } from "../view-api";

const findPlayer = () => {
  const warpper = document.getElementById(PlayerPlaceholderID);
  if (!warpper) {
    console.error("missing main player in HTML");
    return;
  }
  window.__PLAYER_REF__.playerPlaceholder = warpper as HTMLDivElement;
  const obs = new MutationObserver(() => {
    let player = warpper.querySelector<HTMLVideoElement>("video, bwp-video");
    if (player) {
      obs.disconnect();
      console.log("player found");
      window.__PLAYER_REF__.video = player;
      window.__PLAYER_REF__.playerContainer =
        document.getElementById(PlayerContainerID)!;
      window.dispatchEvent(new Event(PlyaerFoundEvent));
    }
  });
  obs.observe(warpper, { childList: true, subtree: true });
};
export default findPlayer;

export const PlyaerFoundEvent = "player-found";
