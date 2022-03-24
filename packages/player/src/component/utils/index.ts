import { Unsubscribe } from "@reduxjs/toolkit";
import { useMemoizedFn } from "ahooks";

import { Media } from "./media-warpper";

export const noop = () => {};
/**
 * exectue all given subscribe actions and return a cleanup function
 * @returns cleanup function to unsubscribe from store
 */
export const mergeSubscribeActions = <R extends Media>(
  media: R,
  actions: ((ref: R) => Unsubscribe | void)[],
): (() => void) => {
  const unsubscribers = actions.map((fn) => fn(media));
  return () => unsubscribers.forEach((fn) => fn && fn());
};

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
