import { PlayerContext } from "@context";
import type { SubscribeHookType } from "@utils/subscribe";
import type { Media } from "mx-base";
import { selectTimestampRequested } from "mx-store";
import { useContext } from "react";

const useGetTimestamp = <R, M extends Media>(
  ref: React.MutableRefObject<R | null>,
  useSubscribe: SubscribeHookType<R, M>,
) => {
  const {
    actions: { gotTimestamp },
  } = useContext(PlayerContext);
  useSubscribe(
    selectTimestampRequested,
    ([req], dispatch, media) => {
      if (!req) return;
      gotTimestamp(dispatch, [media.currentTime, media.duration]);
    },
    { immediate: true, ref },
  );
};

export default useGetTimestamp;
