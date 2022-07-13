import { PayloadAction } from "@reduxjs/toolkit";
import {
  getBasename,
  getFilename,
  HostProviders,
  MediaType,
  Provider,
} from "mx-base";
import { AnyAction } from "redux";
import URLParse from "url-parse";

import { createSlice } from "../../../create-slice";
import { PlayerState } from "../../typings";
import { mediaTypeToPlayerType, PlayerType } from "../../typings";
import { Track } from "../../typings";
import { BilibiliState } from "../../typings/bilibili";
import { HTML5MediaState, SerializableTFile } from "../../typings/html5";
import { YouTubeAPIState } from "../../typings/youtube-api";
import { initialInterface } from "../interface";
import { initialStatus } from "../status";
import { getTitleFromObFile } from "./utils";

const { actions, reducer } = createSlice({
  name: "source", // not used
  state: {} as PlayerState,
  reducers: {
    setDirectLink: (
      _state,
      { payload: [src, type] }: PayloadAction<[src: string, type: MediaType]>,
    ) => {
      // original src url is saved in meta
      let originalSrc = src;

      if (src.startsWith("file:///")) {
        src = src.replace("file:///", "app://local/") + `?${Date.now()}`;
      }

      let state = _state as HTML5MediaState;
      state.type = mediaTypeToPlayerType(type);
      state.source = { allowCORS: true, src, tracks: [] };

      //#region meta
      const { pathname } = new URLParse(src),
        filename = getFilename(pathname);
      state.meta = {
        provider: Provider.html5,
        url: originalSrc,
        title: filename ? getBasename(filename) : src,
      };
      //#endregion
      state.status = initialStatus;
      state.interface = initialInterface;
    },
    setHostMedia: (
      _state,
      action: PayloadAction<[url: string, provider: HostProviders, id: string]>,
    ) => {
      const [src, provider, id] = action.payload;
      let state;
      switch (provider) {
        case Provider.youtube:
          state = _state as YouTubeAPIState;
          // use id as fallback title, will update later
          state.type = PlayerType.youtubeAPI;
          state.source = { id, src };
          state.meta = { provider, url: src, id };
          state.status = {
            ...initialStatus,
            availableSpeeds: [1],
            YTAPIStatus: "none",
            YTPlayerState: null,
          };
          state.interface = initialInterface;
          return;
        case Provider.bilibili:
          state = _state as BilibiliState;
          state.type = PlayerType.bilibili;
          state.source = { id, src };
          state.meta = { provider, url: src, id };
          state.status = {
            ...initialStatus,
            danmaku: false,
            webFscreen: true,
          };
          state.interface = initialInterface;
          return;
        default:
          console.error("given url not supported: ", src, action.payload);
          return;
      }
    },
    setObsidianMedia: (
      _state,
      action: PayloadAction<
        [
          file: SerializableTFile,
          src: string,
          type: MediaType,
          tracks?: Track[],
        ]
      >,
    ) => {
      const [file, src, type, track] = action.payload;

      let state = _state as HTML5MediaState;
      state.type = mediaTypeToPlayerType(type);
      state.source = { allowCORS: true, src, tracks: track ?? [] };
      state.meta = {
        provider: Provider.obsidian,
        file,
        title: getTitleFromObFile(file),
      };
      state.status = initialStatus;
      state.interface = initialInterface;
    },
  },
});

export const { setDirectLink, setHostMedia, setObsidianMedia } = actions;
export default reducer;

/**
 * check if action can init playet state
 */
export const isInitAction = (action: AnyAction) => {
  switch (action.type) {
    case setDirectLink.type:
    case setHostMedia.type:
    case setObsidianMedia.type:
      return true;
    default:
      return false;
  }
};
