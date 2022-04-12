import type { EventEmitter } from "@browser-view/emitter";
import type { MsgFromObsidian } from "@browser-view/msg-obs";

import type { MessageFromViewMap } from "./msg-view";

export type MessageFromObsidianMap = MsgFromObsidian;

export type ObsidianEventEmitter = EventEmitter<
  MessageFromViewMap,
  MessageFromObsidianMap
>;

import useActions from "@browser-view/msg-obs/emit";
import registerMsgHandler from "@browser-view/msg-obs/handle";
export { registerMsgHandler, useActions };
