import { RootState } from "@player/store";

import { actionSlice } from "./slice";

export const selectIsIOS = (state: RootState) =>
  state.action.platform ? state.action.platform === "ios" : null;

export const { canScreenshot, resetCanScreenshot, setPlatform } =
  actionSlice.actions;

export default actionSlice.reducer;
