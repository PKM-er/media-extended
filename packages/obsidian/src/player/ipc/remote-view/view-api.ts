import { EventEmitter } from "@ipc/emitter";

export interface IBrowserViewAPI<Emitter extends EventEmitter<any, any>> {
  emitter: Emitter;
}
