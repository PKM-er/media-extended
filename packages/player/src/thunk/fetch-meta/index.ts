import { fetchBiliMetaReducers } from "./bilibili";
import { ReducerBuilder } from "./common";
import { fetchYoutubeMetaReducers } from "./youtube";

export type { BilibiliMeta } from "./bilibili";
export { name as fetchBiliMetaName } from "./bilibili";
export type { YoutubeMeta } from "./youtube";
export { name as fetchYoutubeMetaName } from "./youtube";

export const fetchMetaReducers = (builder: ReducerBuilder) => (
  fetchYoutubeMetaReducers(builder), fetchBiliMetaReducers(builder)
);
