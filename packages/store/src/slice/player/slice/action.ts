import { Provider } from "mx-base";

import { createSlice } from "../../create-slice";
import {
  disableCORS,
  setDirectLink,
  setHostMedia,
  setObsidianMedia,
  switchToAudio,
  unknownTypeDetermined,
} from "./source";

export interface ActionState {
  /** null meaning feature not available */
  getScreenshot: boolean | null;
  getTimestamp: boolean;
}

const { actions, reducer } = createSlice({
  name: "action",
  state: {} as ActionState,
  reducers: {
    requsetScreenshot: (state) => {
      if (state.getScreenshot !== null) {
        state.getScreenshot = true;
      }
    },
    gotScreenshot: (state) => {
      if (state.getScreenshot !== null) {
        state.getScreenshot = false;
      }
    },
    cancelScreenshot: (state) => {
      if (state.getScreenshot !== null) {
        state.getScreenshot = false;
      }
    },
    requestTimestamp: (state) => {
      state.getTimestamp = true;
    },
    gotTimestamp: (state) => {
      state.getTimestamp = false;
    },
    cancelTimestamp: (state) => {
      state.getTimestamp = false;
    },
  },
  extraReducers: (builder) => {
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
  },
});

export default reducer;
export const {
  cancelScreenshot,
  cancelTimestamp,
  gotScreenshot,
  gotTimestamp,
  requestTimestamp,
  requsetScreenshot,
} = actions;
const setAllowedScreenshot = (allowed: boolean, state: ActionState) => {
  state.getScreenshot = allowed ? false : null;
};
