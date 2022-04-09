import {
  CoreEventHandler,
  useEventHandler as useEventHandler0,
} from "@player/utils";
import { HTMLMedia } from "@player/utils/media";
import React, { HTMLAttributes, ReactEventHandler } from "react";

export type EventHandler = CoreEventHandler<HTMLMedia>;
type NativeEvent =
  | React.SyntheticEvent<HTMLVideoElement>
  | React.SyntheticEvent<HTMLAudioElement>;
const toHTMLMedia = (event: NativeEvent) =>
  new HTMLMedia(event.target as HTMLMediaElement);
export const useEventHandler = (...handler: EventHandler[]) =>
  useEventHandler0(handler, toHTMLMedia);

type EventNamesOf<T extends Element> = {
  [K in keyof HTMLAttributes<T>]-?: Required<
    HTMLAttributes<T>
  >[K] extends ReactEventHandler<T>
    ? K
    : never;
}[keyof HTMLAttributes<T>];
export type EventHandlers<T extends Element> = Pick<
  HTMLAttributes<T>,
  EventNamesOf<T>
>;
