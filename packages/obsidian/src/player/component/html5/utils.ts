import { HTMLMedia } from "@player/utils/media";
import { getSubscribeHook } from "@player/utils/subscribe";
import { MutableRefObject } from "react";

// export const useRefSubscribe = getSubscribeHook<HTMLMedia>(true);

type TargetValue<T> = T | undefined | null;
type TargetType = HTMLElement | Element | Window | Document;
export declare type BasicTarget<T extends TargetType = Element> =
  | (() => TargetValue<T>)
  | TargetValue<T>
  | MutableRefObject<TargetValue<T>>;
export declare type Target = BasicTarget<
  HTMLElement | Element | Window | Document
>;

export const useSubscribe = getSubscribeHook(
  (state) => state.html5.playerReady,
  (refVal: HTMLMediaElement) => new HTMLMedia(refVal),
);
export type PlayerRef = MutableRefObject<HTMLMediaElement | null>;