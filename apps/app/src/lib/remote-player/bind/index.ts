import type { CommRemote } from "../type";
import { mountedEvent } from "../type";
import { registerEvents } from "./event-register";
import { registerHandlers } from "./handler-register";
import { handleReadyState } from "./ready-state";
import { fluentTimeUpdate } from "./time-update";

export async function bindPlayer(player: HTMLMediaElement, port: CommRemote) {
  port.send(mountedEvent, void 0);
  handleReadyState(player, port);
  fluentTimeUpdate(player, port);
  registerEvents(player, port);
  registerHandlers(port, player);
}
