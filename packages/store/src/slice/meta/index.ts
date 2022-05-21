import { getBasename, getFilename, Provider } from "mx-base";
import URLParse from "url-parse";

import {
  renameObsidianMedia,
  setDirectLink,
  setHostMedia,
  setObsidianMedia,
} from "../source";
import { createSlice } from "../utils";
import { MediaMeta } from "./types";
import { getTitleFromObFile } from "./utils";

export * from "./types";

const initialState = {
  provider: null,
} as MediaMeta;

const slice = createSlice({
  name: "meta",
  initialState,
  getState: (s) => s.meta,
  setState: (r, s) => ((r.meta = s), void 0),
  extraReducers: (builder) =>
    builder
      .addCase(setObsidianMedia, (state, action) => {
        const [file] = action.payload;
        return {
          provider: Provider.obsidian,
          file,
          title: getTitleFromObFile(file),
        };
      })
      .addCase(setHostMedia, (state, action) => {
        const [url, provider, id] = action.payload;
        switch (provider) {
          case Provider.youtube:
            return { provider, url, id };
          case Provider.bilibili:
            return { provider, url, id };
          default:
            console.error("given url not supported: ", url, action.payload);
            return;
        }
      })
      .addCase(setDirectLink, (state, action) => {
        const [url] = action.payload;
        const { pathname } = new URLParse(url),
          filename = getFilename(pathname);
        return {
          provider: Provider.html5,
          url,
          title: filename ? getBasename(filename) : url,
        };
      })
      .addCase(renameObsidianMedia, (state, action) => {
        if (state.provider !== Provider.obsidian) {
          throw new Error(
            "Failed to rename obsidian media source: current source not from obsidian",
          );
        }
        const { file } = action.payload;
        state.file = file;
        state.title = getTitleFromObFile(file);
      }),
  reducers: {},
});
export const {} = slice.actions;
export default slice;
