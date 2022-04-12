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
type MsgSentFromView_WithData = MediaEventBinding & ManualUpdate;

type MsgSentFromView_StateChangeNames =
  | "play"
  | "pause"
  | "seeked"
  | "seeking"
  | "waiting"
  | "ended";

interface MsgInvokedFromView {
  hello: [[msgFromView: string], [msgFromOb: string]];
}

export type MsgFromView = {
  [K in keyof MsgSentFromView_WithData]: [MsgSentFromView_WithData[K]];
} & {
  [K in MsgSentFromView_StateChangeNames]: [[]];
} & {
  [K in keyof MsgInvokedFromView as `cb:${K}`]: MsgInvokedFromView[K];
};

export const MediaStateChanges = enumerate<MsgSentFromView_StateChangeNames>()(
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
