import { useMemoizedFn } from "ahooks";

import { useAppSelector } from "../../app/hooks";
import { CoreEventHandler } from "../utils";
import { ApplyHookType } from "./utils";

export const useTimeFragmentEvents = () => {
  const frag = useAppSelector((state) => state.controls.fragment),
    loop = useAppSelector((state) => state.controls.loop);

  const onPlay = useMemoizedFn<CoreEventHandler>((media) => {
    if (!frag) return undefined;
    const [start, end] = frag;
    if (media.duration < start) return;
    if (media.currentTime > end || media.currentTime < start) {
      media.seekTo(start);
    }
  });
  const onTimeUpdate = useMemoizedFn<CoreEventHandler>(async (media) => {
    if (!frag) return undefined;
    const [start, end] = frag;
    if (media.duration < start) return;
    if (media.currentTime > end) {
      if (!loop) {
        media.pause();
      } else {
        media.seekTo(start);
        // continue to play in loop
        // if temporal fragment (#t=,2 at the end of src) paused the media
        if (media.paused) await media.play();
      }
    } else if (media.currentTime < start) {
      media.seekTo(start);
    }
  });

  return { onPlay, onTimeUpdate };
};

export const useApplyTimeFragment: ApplyHookType = (useSubscribe, ref) => {
  // set media time to fragment start time if not in range
  // only handle it when paused, otherwise it will be handled by onTimeUpdate
  useSubscribe(
    (state) => state.controls.fragment,
    ([frag, prevFrag], _dispatch, media) => {
      if (
        media &&
        frag &&
        (media.currentTime < frag[0] || media.currentTime > frag[1])
      )
        media.seekTo(frag[0]);
    },
    { immediate: true, ref },
  );
};
