import type { PlayerRef } from "@player/component/youtube/utils";
import { AppThunk } from "@player/store";

import initializePlayer from "../async-thunk/load-ytb-api";
import { getYoutubeSlice } from "./slice";

const { destroyPlayer: _destroy } = getYoutubeSlice().actions;

const destroyPlayer =
  (playerRef: PlayerRef): AppThunk =>
  (dispatch) => {
    // dispatch event to notify the player will be destroyed
    // then destroy the player
    dispatch(_destroy());
    if (playerRef.current) {
      const playerToDestroy = playerRef.current;
      setTimeout(() => {
        playerToDestroy.destroy();
      }, 0);
      playerRef.current = null;
    }
  };
const resetPlayer =
  (playerRef: PlayerRef, playerEl: HTMLElement, videoId: string): AppThunk =>
  (dispatch) => {
    dispatch(destroyPlayer(playerRef));
    dispatch(initializePlayer([playerRef, playerEl, videoId]));
  };
export { destroyPlayer, initializePlayer, resetPlayer };
