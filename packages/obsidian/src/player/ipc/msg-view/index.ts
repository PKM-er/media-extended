import { enumerate } from "../must-include";

type MediaEventBinding = {
  ratechange: [playbackRate: number];
  timeupdate: [currentTime: number];
  volumechange: [muted: boolean, volume: number];
  durationchange: [duration: number];
  loadedmetadata: [videoWidth: number, videoHeight: number];
  progress: [buffered: number | null, duration: number | null];
  canplay: [buffered: number | null, duration: number | null];
  error: [code: number, message: string];
};
type ManualUpdate = {
  "update-seeking": [seeking: boolean];
  "update-buffer": [buffered: number];
};
type MsgSentWithData = MediaEventBinding & ManualUpdate;

type MsgSent = "play" | "pause" | "seeked" | "seeking" | "waiting" | "ended";

interface MsgWithCallback {
  hello: [[msgFromView: string], [msgFromOb: string]];
}

export type MsgFromView = {
  [K in keyof MsgSentWithData]: [MsgSentWithData[K]];
} & {
  [K in MsgSent]: [[]];
} & {
  [K in keyof MsgWithCallback as `cb:${K}`]: MsgWithCallback[K];
};

export const MediaStateChanges = enumerate<MsgSent>()(
  "play",
  "pause",
  "seeked",
  "seeking",
  "waiting",
  "ended",
);

export const NativeMediaBindingEvents = enumerate<keyof MediaEventBinding>()(
  "ratechange",
  "timeupdate",
  "volumechange",
  "durationchange",
  "loadedmetadata",
  "progress",
  "canplay",
  "error",
);
