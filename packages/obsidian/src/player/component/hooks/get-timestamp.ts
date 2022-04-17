import type { Media } from "@player/utils/media";
import type { SubscribeHookType } from "@player/utils/subscribe";
import { gotTimestamp, selectTimestampRequested } from "@slice/action";

const useGetTimestamp = <R, M extends Media>(
  ref: React.MutableRefObject<R | null>,
  useSubscribe: SubscribeHookType<R, M>,
) => {
  useSubscribe(
    selectTimestampRequested,
    ([req], dispatch, media) => {
      if (!req) return;
      dispatch(gotTimestamp(media.currentTime));
    },
    { immediate: true, ref },
  );
};

export default useGetTimestamp;
