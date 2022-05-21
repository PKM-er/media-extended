import { Provider } from "mx-base";

import {
  disableCORS,
  setDirectLink,
  setHostMedia,
  setObsidianMedia,
  switchToAudio,
  unknownTypeDetermined,
} from "./source";
import { createSlice } from "./utils";

export interface ActionState {
  /** null meaning feature not available */
  getScreenshot: boolean | null;
  getTimestamp: boolean;
}

const initialState: ActionState = {
  getScreenshot: null,
  getTimestamp: false,
};

const slice = createSlice({
  name: "action",
  initialState,
  getState: (s) => s.action,
  setState: (r, s) => ((r.action = s), void 0),
  reducers: {
    // canScreenshot: (state, action: PayloadAction<boolean>) => {
    //   state.getScreenshot = action.payload ? false : null;
    // },
    // resetCanScreenshot: (state) => {
    //   state.getScreenshot = null;
    // },
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
    requestTimestamp: (state) => {
      state.getTimestamp = true;
    },
    gotTimestamp: (state) => {
      state.getTimestamp = false;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(disableCORS, (state) => {
        setCanScreenshot(false, state);
      })
      .addCase(switchToAudio, (state) => {
        setCanScreenshot(false, state);
      })
      .addCase(setObsidianMedia, (state, action) => {
        const [, , mediaType] = action.payload;
        setCanScreenshot(mediaType === "video", state);
      })
      .addCase(setDirectLink, (state, action) => {
        const [, mediaType] = action.payload;
        setCanScreenshot(mediaType === "video", state);
      })
      .addCase(setHostMedia, (state, action) => {
        const [, provider] = action.payload;
        setCanScreenshot(provider === Provider.bilibili, state);
      })
      .addCase(unknownTypeDetermined, (state) => {
        setCanScreenshot(true, state);
      }),
});
export const {
  // canScreenshot,
  // resetCanScreenshot,
  gotScreenshot,
  gotTimestamp,
  requestTimestamp,
  requsetScreenshot,
} = slice.actions;
export default slice;

const setCanScreenshot = (can: boolean, state: ActionState) => {
  state.getScreenshot = can ? false : null;
};
