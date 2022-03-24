import { MutableRefObject } from "react";

import { YoutubeMedia } from "../utils/media-warpper";
import { getSubscribeHook } from "../utils/subscribe";

export const useSubscribe = getSubscribeHook(
  (state) => state.youtube.playerStatus === "ready",
  (refVal: YT.Player) => new YoutubeMedia(refVal),
);
export type PlayerRef = MutableRefObject<YT.Player | null>;
