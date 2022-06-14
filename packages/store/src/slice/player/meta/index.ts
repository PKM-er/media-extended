import { ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { getBasename, getFilename, Provider } from "mx-base";
import URLParse from "url-parse";

import { PlayerState } from "..";
import {
  renameObsidianMedia,
  setDirectLink,
  setHostMedia,
  setObsidianMedia,
} from "../source";
import { getReducer } from "../utils";
import { MediaMeta } from "./types";
import { getTitleFromObFile } from "./utils";

export * from "./types";

const caseReducers = getReducer({});
const extraReducer = (builder: ActionReducerMapBuilder<PlayerState>) => {
  builder
    .addCase(setObsidianMedia, (state, action) => {
      const [file] = action.payload;
      state.meta = {
        provider: Provider.obsidian,
        file,
        title: getTitleFromObFile(file),
      };
    })
    .addCase(setHostMedia, (state, action) => {
      const [url, provider, id] = action.payload;
      let meta: MediaMeta;
      switch (provider) {
        case Provider.youtube:
          meta = { provider, url, id };
          break;
        case Provider.bilibili:
          meta = { provider, url, id };
          break;
        default:
          console.error("given url not supported: ", url, action.payload);
          return;
      }
      state.meta = meta;
    })
    .addCase(setDirectLink, (state, action) => {
      const [url] = action.payload;
      const { pathname } = new URLParse(url),
        filename = getFilename(pathname);
      state.meta = {
        provider: Provider.html5,
        url,
        title: filename ? getBasename(filename) : url,
      };
    })
    .addCase(renameObsidianMedia, (state, action) => {
      if (state.meta.provider !== Provider.obsidian) {
        throw new Error(
          "Failed to rename obsidian media source: current source not from obsidian",
        );
      }
      const { file } = action.payload;
      state.meta.file = file;
      state.meta.title = getTitleFromObFile(file);
    });
};

export default { caseReducers, extraReducer };
