import { ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { Provider } from "mx-base";

import { PlayerState } from ".";
import {
  disableCORS,
  setDirectLink,
  setHostMedia,
  setObsidianMedia,
  switchToAudio,
  unknownTypeDetermined,
} from "./source";
import { getReducer } from "./utils";

export interface ActionState {
  /** null meaning feature not available */
  getScreenshot: boolean | null;
  getTimestamp: boolean;
}

const caseReducer = getReducer({
  requsetScreenshot: (state) => {
    if (state.action.getScreenshot !== null) {
      state.action.getScreenshot = true;
    }
  },
  gotScreenshot: (state) => {
    if (state.action.getScreenshot !== null) {
      state.action.getScreenshot = false;
    }
  },
  cancelScreenshot: (state) => {
    if (state.action.getScreenshot !== null) {
      state.action.getScreenshot = false;
    }
  },
  requestTimestamp: (state) => {
    state.action.getTimestamp = true;
  },
  gotTimestamp: (state) => {
    state.action.getTimestamp = false;
  },
  cancelTimestamp: (state) => {
    state.action.getTimestamp = false;
  },
});
const extraReducer = (builder: ActionReducerMapBuilder<PlayerState>) => {
  builder
    .addCase(disableCORS, (state) => {
      setAllowedScreenshot(false, state);
    })
    .addCase(switchToAudio, (state) => {
      setAllowedScreenshot(false, state);
    })
    .addCase(setObsidianMedia, (state, action) => {
      const [, , mediaType] = action.payload;
      setAllowedScreenshot(mediaType === "video", state);
    })
    .addCase(setDirectLink, (state, action) => {
      const [, mediaType] = action.payload;
      setAllowedScreenshot(mediaType === "video", state);
    })
    .addCase(setHostMedia, (state, action) => {
      const [, provider] = action.payload;
      setAllowedScreenshot(provider === Provider.bilibili, state);
    })
    .addCase(unknownTypeDetermined, (state) => {
      setAllowedScreenshot(true, state);
    });
};

export default { caseReducer, extraReducer };

const setAllowedScreenshot = (allowed: boolean, state: PlayerState) => {
  state.action.getScreenshot = allowed ? false : null;
};
