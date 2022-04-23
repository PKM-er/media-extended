import hookStoreToHTMLPlayer from "@hook-player";

import { BrowserViewAPIName } from "../view-api";
import {
  PlayerContainerID,
  PlayerControlSelector,
  PlayerPlaceholderID,
  SettingBtnSelector,
  SettingMenuWarpSelector,
} from "./const";

const addRef = <K extends keyof typeof window.__PLAYER_REF__>(
  name: K,
  el: Required<typeof window.__PLAYER_REF__>[K],
) => {
  window.__PLAYER_REF__[name] = el;
};
// export const PlyaerFoundEvent = "player-found";

const findPlayer = (
  onFound?: (ref: Required<typeof window.__PLAYER_REF__>) => any,
) => {
  const warpper = document.getElementById(PlayerPlaceholderID);
  if (!warpper) {
    console.error("missing main player in HTML");
    return;
  }
  addRef("playerPlaceholder", warpper);
  const obs = new MutationObserver(() => {
    let player = warpper.querySelector<HTMLVideoElement>("video, bwp-video");
    if (!player) return;
    obs.disconnect();
    hookStoreToHTMLPlayer(player, window[BrowserViewAPIName].store);
    console.log("player found");

    addRef("video", player);
    addRef("playerContainer", document.getElementById(PlayerContainerID)!);
    const controls = document.querySelector<HTMLElement>(
      PlayerControlSelector,
    )!;
    addRef("controls", controls);
    getMenuItems(controls);
    // window.dispatchEvent(new Event(PlyaerFoundEvent));
    onFound?.(window.__PLAYER_REF__ as any);
  });
  obs.observe(warpper, { childList: true, subtree: true });
};
export default findPlayer;

export const HideMenuClass = "mx__hide-menu";

const getMenuItems = (warpper: HTMLElement) => {
  const settingBtn = warpper.querySelector<HTMLElement>(SettingBtnSelector)!;
  settingBtn.classList.add(HideMenuClass);
  settingBtn.dispatchEvent(new MouseEvent("mouseover"));
  settingBtn.dispatchEvent(new MouseEvent("mouseout"));
  settingBtn.classList.remove(HideMenuClass);
  addRef(
    "settingsMenuWarp",
    settingBtn.querySelector<HTMLInputElement>(SettingMenuWarpSelector)!,
  );
};
