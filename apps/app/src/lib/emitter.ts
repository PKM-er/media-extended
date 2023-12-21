import type {
  EventsMap,
  DefaultEvents,
  Emitter,
  Unsubscribe,
} from "nanoevents";
import { createNanoEvents } from "nanoevents";

export function createEventEmitter<Events extends EventsMap = DefaultEvents>() {
  const emitter = createNanoEvents<Events>() as Emitter<Events> & {
    once<K extends keyof Events>(
      this: Emitter,
      event: K,
      cb: Events[K],
    ): Unsubscribe;
  };
  emitter.once = function once(event, callback) {
    const unbind = this.on(event as any, (...args) => {
      unbind();
      callback(...args);
    });
    return unbind;
  };
  return emitter;
}
