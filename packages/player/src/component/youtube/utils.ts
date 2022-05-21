import { YoutubeMedia } from "@utils/media";
import { getSubscribeHook } from "@utils/subscribe";
import { MutableRefObject } from "react";

export const useSubscribe = getSubscribeHook(
  (state) => state.youtube.playerStatus === "ready",
  (refVal: YT.Player) => new YoutubeMedia(refVal),
);
export type PlayerRef = MutableRefObject<YT.Player | null>;
