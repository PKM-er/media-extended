import {
  onFragUpdate,
  onPlay as _onplay,
  onTimeUpdate as _ontu,
} from "@base/fragment";
import { useAppSelector } from "@player/hooks";
import { CoreEventHandler } from "@player/utils";
import { useMemoizedFn } from "ahooks";

import { ApplyHookType } from "./utils";

export const useTimeFragmentEvents = () => {
  const fragment = useAppSelector((state) => state.controls.fragment),
    loop = useAppSelector((state) => state.controls.loop);

  return {
    onPlay: useMemoizedFn<CoreEventHandler>((media) =>
      _onplay(fragment, media),
    ),
    onTimeUpdate: useMemoizedFn<CoreEventHandler>((media) =>
      _ontu(fragment, media, loop),
    ),
  };
};

export const useApplyTimeFragment: ApplyHookType = (useSubscribe, ref) => {
  // set media time to fragment start time if not in range
  // only handle it when paused, otherwise it will be handled by onTimeUpdate
  useSubscribe(
    (state) => state.controls.fragment,
    ([frag], _dispatch, media) => onFragUpdate(frag, media),
    { immediate: true, ref },
  );
};
