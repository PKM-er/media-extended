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
  player_.addEventListener("timeupdate", async () => {
    const [start, end] = player_.frag,
      { currentTime } = player_;
    if (currentTime > end) {
      if (!player_.loop) {
        player_.pause();
      } else {
        player_.currentTime = start;
        // continue to play in loop
        // if temporal fragment (#t=,2 at the end of src) paused the video
        if (player_.paused) await player_.play();
      }
    } else if (currentTime < start) {
      player_.currentTime = start;
    }
  });
  player_.addEventListener("play", () => {
    const [start, end] = player_.frag,
      { currentTime } = player_;
    if (currentTime > end || currentTime < start) {
      player_.currentTime = start;
    }
  });
  emitter.on("timefrag", (frag) => {
    if (frag) {
      player_.frag = frag;
      if (player_.currentTime < frag[0] || player_.currentTime > frag[1]) {
        player_.currentTime = frag[0];
      }
    } else {
      player_.frag = defaultFrag;
    }
  });
  emitter.on("play", () => player.play());
  emitter.on("pause", () => player.pause());
  emitter.on("timefrag", (frag) => {
    console.log("timefrag", frag);
  });
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
    if (player instanceof HTMLVideoElement) {
      return [[player.currentTime, player.duration]];
    } else throw new Error("media element is not a video");
  });
};
export default registerMsgHandler;
