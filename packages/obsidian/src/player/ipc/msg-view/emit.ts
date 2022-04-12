import { getBuffered } from "@player/utils/get-buffered";
import assertNever from "assert-never";

import type { EventEmitter } from "../emitter";
import { MsgFromObsidian } from "../msg-obs";
import { MediaStateChanges, MsgFromView, NativeMediaBindingEvents } from ".";

type Emitter = EventEmitter<MsgFromObsidian, MsgFromView>;

const getEvtHandler = <T extends Emitter>(
  event: typeof NativeMediaBindingEvents[number],
  emitter: T,
): ((event: { target: HTMLVideoElement }) => void) => {
  switch (event) {
    case "ratechange":
      return ({ target }) => emitter.send(event, target.playbackRate);
    case "timeupdate":
      return ({ target }) => emitter.send(event, target.currentTime);
    case "volumechange":
      return ({ target }) => emitter.send(event, target.muted, target.volume);
    case "durationchange":
      return ({ target }) => emitter.send(event, target.duration);
    case "loadedmetadata":
      return ({ target }) =>
        emitter.send(event, target.videoWidth, target.videoHeight);
    case "progress":
    case "canplay":
      return ({ target }) =>
        emitter.send(event, getBuffered(target), target.duration);
    case "error":
      return ({ target }) =>
        target.error &&
        emitter.send(event, target.error.code, target.error.message);
    default:
      assertNever(event);
  }
};

const AELOptions = { passive: true };
const HookMediaEvents = <T extends Emitter>(
  target: HTMLVideoElement,
  emitter: T,
) => {
  for (const event of MediaStateChanges) {
    target.addEventListener(event, () => emitter.send(event), AELOptions);
  }
  for (const event of NativeMediaBindingEvents) {
    target.addEventListener(
      event,
      getEvtHandler(event, emitter) as any,
      AELOptions,
    );
  }

  if (target.videoHeight || target.videoWidth) {
    emitter.send("loadedmetadata", target.videoWidth, target.videoHeight);
  }
  let buffer = getBuffered(target);
  if (buffer) emitter.send("update-buffer", buffer);
  emitter.send("update-seeking", target.seeking);
};
export default HookMediaEvents;
