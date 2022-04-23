import { ActionReducerMapBuilder } from "@reduxjs/toolkit";

import { fetchBiliMeta } from "../async-thunk/bilibili";
import fetchYoutubeMeta from "../async-thunk/fetch-ytb-meta";
import { ProviderState } from "./slice";

const getFetchMetaActionReducer = (
  builder: ActionReducerMapBuilder<ProviderState>,
) => {
  builder
    .addCase(fetchYoutubeMeta.pending, (state) => {
      if (state.source?.from === "youtube") state.source.title = null;
      else
        console.error(
          "failed to apply youtube meta: current source not youtube",
          state.source,
        );
    })
    .addCase(fetchYoutubeMeta.fulfilled, (state, action) => {
      const { title } = action.payload;
      if (state.source?.from === "youtube") state.source.title = title;
      else
        console.error(
          "failed to apply youtube meta: current source not youtube",
          state.source,
        );
    })
    .addCase(fetchYoutubeMeta.rejected, (state, action) => {
      if (state.source?.from === "youtube")
        state.source.title = state.source.id;
      else
        console.error(
          "failed to apply youtube meta: current source not youtube",
          state.source,
        );
      console.error("Failed to fetch youtube metadata: ", action.payload);
    })
    .addCase(fetchBiliMeta.pending, (state) => {
      if (state.source?.from === "bilibili") state.source.title = null;
      else
        console.error(
          "failed to apply bilibili meta: current source not bilibili",
          state.source,
        );
    })
    .addCase(fetchBiliMeta.fulfilled, (state, action) => {
      const { title } = action.payload;
      if (state.source?.from === "bilibili") state.source.title = title;
      else
        console.error(
          "failed to apply bilibili meta: current source not bilibili",
          state.source,
        );
    })
    .addCase(fetchBiliMeta.rejected, (state, action) => {
      if (state.source?.from === "bilibili")
        state.source.title = state.source.id;
      else
        console.error(
          "failed to apply youtube meta: current source not bilibili",
          state.source,
        );
      console.error("Failed to fetch bilibili metadata: ", action.payload);
    });
};
export default getFetchMetaActionReducer;
