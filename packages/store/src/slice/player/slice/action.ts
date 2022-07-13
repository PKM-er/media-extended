import { createSlice } from "../../create-slice";

export interface ActionState {
  getScreenshot: boolean;
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
