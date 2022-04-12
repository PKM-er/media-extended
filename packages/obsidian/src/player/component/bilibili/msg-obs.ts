import type { EventEmitter } from "@ipc/emitter";
import type { MsgFromObsidian } from "@ipc/msg-obs";

import type { MessageFromViewMap } from "./msg-view";

export type MessageFromObsidianMap = MsgFromObsidian;

export type ObsidianEventEmitter = EventEmitter<
  MessageFromViewMap,
  MessageFromObsidianMap
>;

import useActions from "@ipc/msg-obs/emit";
import registerMsgHandler from "@ipc/msg-obs/handle";
export { registerMsgHandler, useActions };
