import type { RootState } from "@player/store";

import { getProviderSlice } from "./slice";

export const { renameStateReverted } = getProviderSlice().actions;

export default getProviderSlice;

export const selectPlayerType = (state: RootState) =>
  state.provider.source?.playerType ?? null;
