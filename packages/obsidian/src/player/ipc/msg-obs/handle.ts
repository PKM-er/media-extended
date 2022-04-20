import { onFragUpdate, onPlay, onTimeUpdate } from "@base/fragment";
import { HTMLMedia } from "@player/utils/media";
import { captureScreenshot } from "mx-lib";

import { EventEmitter } from "../emitter";
import { MsgFromView } from "../msg-view";
import { MsgFromObsidian } from ".";

type Emitter = EventEmitter<MsgFromObsidian, MsgFromView>;

interface PlayerWithFrag extends HTMLMediaElement {
  frag: readonly [from: number, to: number];
}

const defaultFrag = [0, Infinity] as const;
const registerMsgHandler = <E extends Emitter>(
  emitter: E,
  player: HTMLMediaElement,
) => {
  const player_ = player as PlayerWithFrag;
  player_.frag = defaultFrag;
  const media = new HTMLMedia(player_);
  player_.addEventListener("timeupdate", () =>
    onTimeUpdate(player_.frag, media, player_.loop),
  );
  player_.addEventListener("play", () => onPlay(player_.frag, media));
  emitter.on("timefrag", (frag) => {
    player_.frag = frag ?? defaultFrag;
    if (frag) {
      onFragUpdate(frag, media);
    }
  });
  emitter.on("play", () => player.play());
  emitter.on("pause", () => player.pause());
  emitter.on("changerate", (playbackRate) => {
    player.playbackRate = playbackRate;
  });
  emitter.on("changevolume", (muted, volume) => {
    player.muted = muted;
    player.volume = volume;
  });
  emitter.on("updatetime", (currentTime) => {
    player.currentTime = currentTime;
  });
  emitter.handle("cb:screenshot", async (type) => {
    if (player instanceof HTMLVideoElement) {
      const { blob, time } = await captureScreenshot(player, type);
      if (!blob) throw new Error("failed to capture screenshot");
      const ab = await blob.arrayBuffer();
      return [[ab, time], [ab]];
    } else throw new Error("media element is not a video");
  });
  emitter.handle("cb:timestamp", () => {
    return [[player.currentTime, player.duration]];
  });
};
export default registerMsgHandler;
