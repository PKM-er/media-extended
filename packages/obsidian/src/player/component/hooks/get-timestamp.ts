import { gotTimestamp } from "@player/thunk/action";
import type { SubscribeHookType } from "@player/utils/subscribe";
import type { Media } from "mx-base";
import { selectTimestampRequested } from "mx-store";

const useGetTimestamp = <R, M extends Media>(
  ref: React.MutableRefObject<R | null>,
  useSubscribe: SubscribeHookType<R, M>,
) => {
  useSubscribe(
    selectTimestampRequested,
    ([req], dispatch, media) => {
      if (!req) return;
      dispatch(gotTimestamp(media.currentTime, media.duration));
    },
    { immediate: true, ref },
  );
};

export default useGetTimestamp;
