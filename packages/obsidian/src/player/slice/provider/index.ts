import type { RootState } from "@player/store";

import { getProviderSlice } from "./slice";

export const { renameStateReverted, setTitle } = getProviderSlice().actions;

export default getProviderSlice;

export const selectPlayerType = (state: RootState) =>
    state.provider.source?.playerType ?? null,
  selectAllowCORS = (state: RootState) => {
    if (state.provider.source?.from === "direct")
      return state.provider.source.allowCORS;
    else return true;
  },
  selectFrag = (state: RootState) => state.controls.fragment,
  selectLoop = (state: RootState) => state.controls.loop,
  selectDuration = (state: RootState) => state.controls.duration,
  selectVolumeMute = (state: RootState): [muted: boolean, volume: number] => [
    state.controls.muted,
    state.controls.volume,
  ];
