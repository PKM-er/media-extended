import { PayloadAction } from "@reduxjs/toolkit";
import type { HostProviders, MediaType } from "mx-base";
import { Provider } from "mx-base";

import { SerializableTFile } from "../meta/types";
import { createSlice } from "../utils";
import {
  HTMLMediaSource,
  isHTMLMediaSource,
  mediaTypeToPlayerType,
  PlayerSource,
  PlayerType,
  Track,
} from "./types";

export * from "./types";

const initialState = {
  type: null,
  src: null,
} as PlayerSource;
const slice = createSlice({
  name: "source",
  initialState,
  getState: (s) => s.source,
  setState: (r, s) => ((r.source = s), void 0),
  reducers: {
    switchToAudio: (state) => {
      if (isHTMLMediaSource(state)) {
        state.type = PlayerType.audio;
      } else {
        throw new TypeError("trying to switch to audio on non-html5 source");
      }
    },
    unknownTypeDetermined: (state) => {
      if (state && state.type === PlayerType.unknown) {
        state.type = PlayerType.video;
      } else {
        console.error(
          "player source invaild to call unknownTypeDetermined: ",
          state,
        );
        throw new TypeError(
          "player source invaild to call unknownTypeDetermined: ",
        );
      }
    },
    disableCORS: (state) => {
      if (isHTMLMediaSource(state)) {
        state.allowCORS = false;
      }
    },
    setDirectLink: (
      state,
      action: PayloadAction<[src: string, type: MediaType]>,
    ) => {
      let [src, type] = action.payload;

      let isFileUrl = false;
      src = src.replace(/^file:\/\//, () => {
        isFileUrl = true;
        return "app://local";
      });
      isFileUrl && (src += `?${Date.now()}`);

      const source: HTMLMediaSource = {
        allowCORS: true,
        src,
        type: mediaTypeToPlayerType(type),
        tracks: [],
      };
      return source;
    },
    setHostMedia: (
      state,
      action: PayloadAction<[url: string, provider: HostProviders, id: string]>,
    ) => {
      const [src, provider, id] = action.payload;
      switch (provider) {
        case Provider.youtube:
          // use id as fallback title, will update later
          return { type: PlayerType.youtubeAPI, id, src };
        case Provider.bilibili:
          return { type: PlayerType.bilibili, id, src };
        default:
          console.error("given url not supported: ", src, action.payload);
          return;
      }
    },
    setObsidianMedia: (
      state,
      action: PayloadAction<
        [
          file: SerializableTFile,
          src: string,
          type: MediaType,
          tracks?: Track[],
        ]
      >,
    ) => {
      const [, src, type, track] = action.payload;
      const media: HTMLMediaSource = {
        src,
        type: mediaTypeToPlayerType(type),
        allowCORS: true,
        tracks: track ?? [],
      };
      return media;
    },
    renameObsidianMedia: (
      state,
      action: PayloadAction<{ file: SerializableTFile; src: string }>,
    ) => {
      if (state.type === null) {
        throw new Error(
          "Failed to rename obsidian media source: no source set",
        );
      }
      const { src } = action.payload;
      state.src = src;
    },
  },
});
export const {
  setDirectLink,
  setHostMedia,
  setObsidianMedia,
  disableCORS,
  switchToAudio,
  unknownTypeDetermined,
  renameObsidianMedia,
} = slice.actions;
export default slice;
