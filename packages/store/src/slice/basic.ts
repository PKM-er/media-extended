type Platform = "safari" | "chromium";

export interface BasicState {
  platform: Platform | null;
  language: string;
}

const initialState: BasicState = {
  platform: null,
  language: "en",
};

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const slice = createSlice({
  initialState,
  name: "basic",
  reducers: {
    setInitInfo: (
      state,
      action: PayloadAction<{ platform: Platform; lang: string }>,
    ) => {
      const { lang, platform } = action.payload;
      state.language = lang;
      state.platform = platform;
    },
  },
});

export default slice.reducer;

export const { setInitInfo } = slice.actions;
