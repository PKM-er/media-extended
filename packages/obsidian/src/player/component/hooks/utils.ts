import { SubscribeHookType } from "@player/utils/subscribe";
import { Media } from "mx-base";
import { MutableRefObject } from "react";

export type ApplyHookType = <R, M extends Media>(
  useSubscribe: SubscribeHookType<R, M>,
  ref: MutableRefObject<R | null>,
) => void;
