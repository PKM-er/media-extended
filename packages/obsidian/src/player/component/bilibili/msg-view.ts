import type { EventEmitter } from "@ipc/emitter";
import type { MsgFromView } from "@ipc/msg-view";

import type { MessageFromObsidianMap } from "./msg-obs";

export type MessageFromViewMap = MsgFromView &
  Record<"enter-web-fullscreen" | "exit-web-fullscreen", [[]]>;

export type BrowserViewEventEmitter = EventEmitter<
  MessageFromObsidianMap,
  MessageFromViewMap
>;
