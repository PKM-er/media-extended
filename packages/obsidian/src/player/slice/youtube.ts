import config from "@player/config";
import { AppThunk, RootState } from "@player/store";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { PlayerRef } from "../component/youtube/utils";
import { handleDurationChange } from "./controls";
import loadYoutubeAPI from "./load-ytb-api";

export interface YoutubeState {
  playerStatus: "none" | "loading" | "error" | "inited" | "ready";
  availableSpeeds: number[];
  /* changing this value will trigger volume update */
  volumeOffest: number | null;
}

const initialState: YoutubeState = {
  playerStatus: "none",
  availableSpeeds: [1],
  volumeOffest: null,
};

export const youtubeSlice = createSlice({
  name: "youtube",
  initialState,
  reducers: {
    handlePlayerReady: (
      state,
      action: PayloadAction<{ availableSpeeds: number[] }>,
    ) => {
      state.playerStatus = "ready";
      state.availableSpeeds = action.payload.availableSpeeds;
    },
    destroyPlayer: (state) => {
      state.playerStatus = "none";
      state.availableSpeeds = initialState.availableSpeeds;
    },
    requsetSetVolumeByOffest: (state, action: PayloadAction<number>) => {
      state.volumeOffest = action.payload;
    },
    setVolumeByOffestDone: (state) => {
      state.volumeOffest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializePlayer.pending, (state) => {
        state.playerStatus = "loading";
      })
      .addCase(initializePlayer.fulfilled, (state) => {
        state.playerStatus = "inited";
      })
      .addCase(initializePlayer.rejected, (state, action) => {
        state.playerStatus = "error";
        console.error(action.error, action.payload);
      });
  },
});

const baseOptions = {
  width: 0,
  height: 0,
  playerVars: {
    origin: config.origin,
    // Disable keyboard as we handle it
    disablekb: +true,
    modestbranding: +true,
    hl: config.language,
  },
};

export const initializePlayer = createAsyncThunk<
  void,
  [ref: PlayerRef, container: HTMLElement, videoId: string],
  { state: RootState }
>(
  "youtube/initializePlayer",
  async ([ref, container, videoId], { getState, dispatch }) => {
    const { Player } = await loadYoutubeAPI();

    const state = getState(),
      { muted, autoplay, loop } = state.controls,
      { controls } = state.interface;

    const elToReplace = document.createElement("div");
    // @ts-ignore something wrong with type checking in react-script...
    container.replaceChildren(elToReplace);

    const player = new Player(elToReplace, {
      ...baseOptions,
      videoId,
      playerVars: {
        ...baseOptions.playerVars,
        mute: +muted,
        autoplay: +autoplay,
        loop: +loop,
        controls: +(controls === "native"),
      },
      events: {
        onReady: ({ target }) => {
          // Bail if onReady has already been called.
          // See https://github.com/sampotts/plyr/issues/1108
          if (getState().youtube.playerStatus === "ready") return;
          const availableSpeeds = target.getAvailablePlaybackRates();
          dispatch(handlePlayerReady({ availableSpeeds }));
          dispatch(handleDurationChange(target.getDuration()));
        },
      },
    });
    let iframe;
    // Set the tabindex to avoid focus entering iframe
    if (controls === "custom" && (iframe = player.getIframe())) {
      iframe.tabIndex = -1;
    }
    ref.current = player;
  },
);

export const destroyPlayer =
  (playerRef: PlayerRef): AppThunk =>
  (dispatch) => {
    // dispatch event to notify the player will be destroyed
    // then destroy the player
    dispatch(youtubeSlice.actions.destroyPlayer());
    if (playerRef.current) {
      const playerToDestroy = playerRef.current;
      setTimeout(() => {
        playerToDestroy.destroy();
      }, 0);
      playerRef.current = null;
    }
  };
export const resetPlayer =
  (playerRef: PlayerRef, playerEl: HTMLElement, videoId: string): AppThunk =>
  (dispatch) => {
    dispatch(destroyPlayer(playerRef));
    dispatch(initializePlayer([playerRef, playerEl, videoId]));
  };
export const {
  handlePlayerReady,
  requsetSetVolumeByOffest,
  setVolumeByOffestDone,
} = youtubeSlice.actions;

export { loadYoutubeAPI as loadAPI };

export default youtubeSlice.reducer;
