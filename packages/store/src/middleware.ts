import { Emitter, EventsMap } from "nanoevents";
import { Middleware } from "redux";

import { actionPrefix, isActionMediaControl } from "./slice/player/direct-exec";

export const createMediaControlMiddleware =
  <M extends EventsMap>(emitter: Emitter<M>): Middleware =>
  (store) =>
  (next) =>
  (action) => {
    if (isActionMediaControl(action)) {
      const params = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      emitter.emit(
        (action.type as string).substring(actionPrefix.length),
        ...params,
      );
    }
    return next(action);
  };

export const skipMediaControlAction: Middleware =
  (store) => (next) => (action) => {
    // if media control action, do not pass to reducer
    if (isActionMediaControl(action)) return;
    return next(action);
  };
