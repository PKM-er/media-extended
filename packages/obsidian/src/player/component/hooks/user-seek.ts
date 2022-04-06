import { AppDispatch } from "@player/store";
import type { Media } from "@player/utils/media-warpper";
import type { SubscribeHookType } from "@player/utils/subscribe";
import { useLatest } from "ahooks";
import { MutableRefObject } from "react";

export const useApplyUserSeek = <R, M extends Media>(
  useSubscribe: SubscribeHookType<R, M>,
  ref: MutableRefObject<R | null>,
  extra?: (dispatch: AppDispatch, currentTime: number) => void,
) => {
  const extraRef = useLatest(extra);
  useSubscribe(
    (state) => state.controls.userSeek,
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
