import { MutableRefObject } from "react";

import { Media } from "../utils/media-warpper";
import { SubscribeHookType } from "../utils/subscribe";

export type ApplyHookType = <R, M extends Media>(
  useSubscribe: SubscribeHookType<R, M>,
  ref: MutableRefObject<R | null>,
) => void;
