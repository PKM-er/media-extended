import { CoreEventHandler } from "@utils";
import { HTMLMedia } from "@utils/media";
import { handleError } from "mx-store";
import { AppDispatch, PlayerStore } from "mx-store";

import { updateBufferH5, updateRatio } from "../common";
import generalEventHandlers from "./general";

export type EventHandlers = {
  [K in keyof HTMLMediaElementEventMap]?: CoreEventHandler<HTMLMedia>;
};

const hookHTMLEvents = (player: HTMLMediaElement, store: PlayerStore) => {
  const dispatch = (action: Parameters<AppDispatch>[0]) =>
    store.dispatch(action);

  let { handlers: _handlers, unload } = generalEventHandlers<HTMLMedia>(store);
  const handlers: EventHandlers = {
    ..._handlers,
    canplay: ({ instance }) => updateBufferH5(instance, dispatch),
    loadedmetadata: ({ instance }) => {
      // useUpdateRatio
      updateRatio(instance, dispatch);
    },
    progress: ({ instance }) => updateBufferH5(instance, dispatch),
    error: ({ instance }) => {
      const { error } = instance;
      if (error)
        dispatch(handleError({ message: error.message, code: error.code }));
    },
  };

  const media = new HTMLMedia(player);
  const toUnload = [unload];
  for (const kv of Object.entries(handlers)) {
    const [eventName, handler] = kv as [
      keyof EventHandlers,
      EventHandlers[keyof EventHandlers],
    ];
    if (handler) {
      const warpper = () => handler(media);
      player.addEventListener(eventName, warpper);
      toUnload.push(() => player.removeEventListener(eventName, warpper));
    }
  }

  return () => toUnload.forEach((unload) => unload());
};
export default hookHTMLEvents;
