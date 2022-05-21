import { createAsyncThunk } from "@reduxjs/toolkit";
import { config, fetchYoutubeMetaName } from "mx-player";
import { setRatio } from "mx-store";
import { RootState } from "mx-store";

export const fetchYoutubeMeta = createAsyncThunk<
  Record<"title", string>,
  string,
  { state: RootState }
>(fetchYoutubeMetaName, async (videoId, { dispatch }) => {
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
