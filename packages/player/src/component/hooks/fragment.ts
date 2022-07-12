import { Frag } from "mx-base";
const { onFragUpdate, onPlay: _onplay, onTimeUpdate: _ontimeupdate } = Frag;
import { useAppSelector } from "@store-hooks";
import { CoreEventHandler } from "@utils";
import { useMemoizedFn } from "ahooks";
import { selectFrag, selectLoop } from "mx-store";

import { ApplyHookType } from "./utils";

export const useTimeFragmentEvents = () => {
  const fragment = useAppSelector(selectFrag),
    loop = useAppSelector(selectLoop);

  return {
    onPlay: useMemoizedFn<CoreEventHandler>((media) =>
      _onplay(fragment, media),
    ),
    onTimeUpdate: useMemoizedFn<CoreEventHandler>((media) =>
      _ontimeupdate(fragment, media, loop ?? false),
    ),
  };
};

export const useApplyTimeFragment: ApplyHookType = (useSubscribe, ref) => {
  // set media time to fragment start time if not in range
  // only handle it when paused, otherwise it will be handled by onTimeUpdate
  useSubscribe(
    selectFrag,
    ([frag], _dispatch, media) => onFragUpdate(frag, media),
    { immediate: true, ref },
  );
};
