import config from "@player/config";
import { ActionReducerMapBuilder, createAsyncThunk } from "@reduxjs/toolkit";
import { setRatio } from "@slice/interface";
import metaSlice from "@slice/meta";
import { MediaMeta, Provider } from "@slice/meta/types";
import { RootState } from "@store";

import { logNotMatch, ReducerBuilder } from "./common";

const thunk = createAsyncThunk<
  Record<"title", string>,
  string,
  { state: RootState }
>(metaSlice.name + "/fetchYoutubeMetadata", async (videoId, { dispatch }) => {
  const result = await fetch(config.urls.youtube.meta_api + videoId);
  if (!result.ok) {
    throw new Error(
      `Failed to fetch youtube metadata: (${result.status}) ${result.statusText}`,
    );
  }
  const { width, height, title, thumbnail_url } = await result.json();
  if (width && height && width > 0 && height > 0) {
    dispatch(setRatio([width, height]));
  }
  return { title };
});

const source = "youtube";
export const fetchYoutubeMetaReducers = (builder: ReducerBuilder) =>
  builder
    .addCase(thunk.pending, ({ meta }) => {
      if (meta.provider === Provider.youtube) meta.title = "";
      else logNotMatch(source, meta);
    })
    .addCase(thunk.fulfilled, ({ meta }, action) => {
      const { title } = action.payload;
      if (meta.provider === Provider.youtube) meta.title = title;
      else logNotMatch(source, meta);
    })
    .addCase(thunk.rejected, ({ meta }, action) => {
      if (meta.provider === Provider.youtube) {
      } else logNotMatch(source, meta);
      console.error("Failed to fetch youtube metadata: ", action.payload);
    });

export default thunk;
