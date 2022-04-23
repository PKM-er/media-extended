import config from "@player/config";
import { RootState } from "@player/store";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { setRatio } from "../interface";

const fetchYoutubeMeta = createAsyncThunk<
  Record<"title", string>,
  string,
  { state: RootState }
>("provider/fetchYoutubeMetadata", async (videoId, { dispatch }) => {
  const result = await await fetch(config.urls.youtube.meta_api + videoId);
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

export default fetchYoutubeMeta;
