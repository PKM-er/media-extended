import { useMemoizedFn } from "ahooks";

import { Media } from "./media";

export const noop = () => {};

export const mergeEvents =
  <A extends any[]>(...callbacks: ((...args: A) => any)[]) =>
  (...args: A) =>
    callbacks.forEach((callback) => callback(...args));

export type CoreEventHandler<M extends Media = Media> = (instance: M) => void;
export const useEventHandler = <M extends Media, E>(
  handler: CoreEventHandler<M> | CoreEventHandler<M>[],
  getMediaFromEvt: (event: E) => M,
) => {
  const newHandler = Array.isArray(handler) ? mergeEvents(...handler) : handler;
  return useMemoizedFn((evt: E) => newHandler(getMediaFromEvt(evt)));
};
