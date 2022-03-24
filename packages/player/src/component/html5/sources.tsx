import { PlayerRef, useSubscribe } from "./utils";

export const useLoadSources = (ref: PlayerRef) => {
  useSubscribe(
    (state) => state.provider,
    (_v, _d, media) => {
      media.instance.load();
    },
    { immediate: false, ref },
  );
};
