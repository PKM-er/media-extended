import { enumerate } from "../must-include";

type MsgSentFromOb_WithData = {
  timefrag: [frag: [from: number, to: number] | null];
  changerate: [playbackRate: number];
  changevolume: [muted: boolean, volume: number];
  updatetime: [currentTime: number];
};

type MsgSentFromOb_StateChangeNames =
  | "play"
  | "pause"
  | "enter-fullscreen"
  | "exit-fullscreen";

interface MsgInvokedFromOb {
  screenshot: [
    [type: "image/jpeg" | "image/webp"],
    [data: ArrayBuffer, time: number],
  ];
  timestamp: [[], [currentTime: number, duration: number]];
}

export type MsgFromObsidian = {
  [K in keyof MsgSentFromOb_WithData]: [MsgSentFromOb_WithData[K]];
} & {
  [K in MsgSentFromOb_StateChangeNames]: [[]];
} & {
  [K in keyof MsgInvokedFromOb as `cb:${K}`]: MsgInvokedFromOb[K];
};

export const MediaStateChanges = enumerate<MsgSentFromOb_StateChangeNames>()(
  "play",
  "pause",
  "enter-fullscreen",
  "exit-fullscreen",
);

export const MessageWithData = enumerate<keyof MsgSentFromOb_WithData>()(
  "timefrag",
  "changerate",
  "changevolume",
  "updatetime",
);
