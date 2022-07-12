import type { SubscribeHookType } from "@utils/subscribe";
import { useLatest } from "ahooks";
import type { Media } from "mx-base";
import { AppDispatch, selectUserSeek } from "mx-store";
import { MutableRefObject } from "react";

export const useApplyUserSeek = <R, M extends Media>(
  useSubscribe: SubscribeHookType<R, M>,
  ref: MutableRefObject<R | null>,
  extra?: (dispatch: AppDispatch, currentTime: number) => void,
) => {
  const extraRef = useLatest(extra);
  useSubscribe(
    selectUserSeek,
    ([seek, prevSeek], dispatch, media) => {
      if (!media) return;
      let params: [time: number, options: { allowSeekAhead: boolean }] | null =
        null;
      // https://developers.google.com/youtube/iframe_api_reference#seekTo
      if (seek) {
        params = [seek.currentTime, { allowSeekAhead: false }];
      } else if (prevSeek) {
        // seek ends
        params = [prevSeek.currentTime, { allowSeekAhead: true }];
      }
      if (params) {
        extraRef.current?.(dispatch, params[0]);
        media.seekTo(...params);
      }
    },
    { immediate: true, ref },
  );
};
