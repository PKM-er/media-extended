import { EventEmitter } from "../emitter";

export interface IBrowserViewAPI<Emitter extends EventEmitter<any, any>> {
  emitter: Emitter;
}
