import fetchBiliMeta, { fetchBiliMetaReducers } from "./bilibili";
import { ReducerBuilder } from "./common";
import fetchYoutubeMeta, { fetchYoutubeMetaReducers } from "./youtube";

const fetchMetaReducers = (builder: ReducerBuilder) => (
  fetchYoutubeMetaReducers(builder), fetchBiliMetaReducers(builder)
);
export default fetchMetaReducers;

export { fetchBiliMeta, fetchYoutubeMeta };
