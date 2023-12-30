import type { MsgCtrlRemote } from "../type";
import { mountedEvent } from "../type";
import { registerEvents } from "./event-register";
import { registerHandlers } from "./handler-register";
import { handleReadyState } from "./ready-state";
import { fluentTimeUpdate } from "./time-update";

export default async function bindMediaEl(
  player: HTMLMediaElement,
  port: MsgCtrlRemote,
) {
  port.send(mountedEvent, void 0);
  handleReadyState(player, port);
  fluentTimeUpdate(player, port);
  registerEvents(player, port);
  registerHandlers(port, player);
}
