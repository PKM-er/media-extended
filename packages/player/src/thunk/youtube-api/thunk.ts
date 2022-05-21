import type { PlayerRef } from "@component/youtube/utils";
import type { AppThunk } from "mx-store";
import { destroyPlayer as _destroy } from "mx-store";

import { initAPI, initPlayer } from "./init-api";

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
  (dispatch, getState) => {
    dispatch(destroyPlayer(playerRef));
    dispatch(initAPI());
    initPlayer(playerRef, playerEl, videoId, { dispatch, getState });
  };
export { destroyPlayer, initAPI, resetPlayer };
