import { BasicPlayerStatus } from "../../typings";

export { default as basicStatusReducer } from "./basic";
export * from "./basic";
export * from "./bilibili";
export * from "./youtube";

export const initialStatus: BasicPlayerStatus = {
  fragment: null,
  paused: true,
  playbackRate: 1.5,
  volume: 0.8,
  muted: false,
  autoplay: false,
  loop: false,
  currentTime: 0,
  seeking: false,
  duration: null,
  buffered: 0,
  waiting: false,
  ended: false,
  hasStarted: false,
  error: null,
};
