import type { MsgFromView } from "@browser-view/msg-view";
import HookMediaEvents from "@browser-view/msg-view/emit";

import type { EventEmitter } from "../browser-view/emitter";
import type { MessageFromObsidianMap } from "./msg-obs";

export type MessageFromViewMap = MsgFromView &
  Record<"enter-web-fullscreen" | "exit-web-fullscreen", [[]]>;
export { HookMediaEvents };

export type BrowserViewEventEmitter = EventEmitter<
  MessageFromObsidianMap,
  MessageFromViewMap
>;
