import { YoutubeMedia } from "@utils/media";
import { getSubscribeHook } from "@utils/subscribe";
import { selectYoutubeAPIReady } from "mx-store";
import { MutableRefObject } from "react";

export const useSubscribe = getSubscribeHook(
  selectYoutubeAPIReady,
  (refVal: YT.Player) => new YoutubeMedia(refVal),
);
export type PlayerRef = MutableRefObject<YT.Player | null>;
