import { Media } from "@player/utils/media";
import { SubscribeHookType } from "@player/utils/subscribe";
import { MutableRefObject } from "react";

export type ApplyHookType = <R, M extends Media>(
  useSubscribe: SubscribeHookType<R, M>,
  ref: MutableRefObject<R | null>,
) => void;
