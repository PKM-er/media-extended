import {
  ActionReducerMapBuilder,
  createAction,
  PayloadAction,
} from "@reduxjs/toolkit";
import type { HostProviders, MediaType } from "mx-base";
import { Provider } from "mx-base";

import { PlayerState } from "..";
import { SerializableTFile } from "../meta/types";
import { getReducer } from "../utils";
import {
  HTMLMediaSource,
  isHTMLMediaSource,
  mediaTypeToPlayerType,
  PlayerSource,
  PlayerType,
  Track,
} from "./types";

export * from "./types";

const selectSource = (state: PlayerState) => state.source;

export const setDirectLink = createAction<[src: string, type: MediaType]>(
    "player/setDirectLink",
  ),
  setHostMedia = createAction<
    [url: string, provider: HostProviders, id: string]
  >("player/setHostMedia"),
  setObsidianMedia = createAction<
    [file: SerializableTFile, src: string, type: MediaType, tracks?: Track[]]
  >("player/setObsidianMedia"),
  renameObsidianMedia = createAction<{ file: SerializableTFile; src: string }>(
    "player/renameObsidianMedia",
  ),
  switchToAudio = createAction("player/switchToAudio"),
  unknownTypeDetermined = createAction("player/unknownTypeDetermined"),
  disableCORS = createAction("player/disableCORS");

export const resetActions = [setObsidianMedia, setDirectLink, setHostMedia].map(
  (a) => a.type,
);

const caseReducers = getReducer({});

const extraReducer = (builder: ActionReducerMapBuilder<PlayerState>) => {
  builder
    .addCase(setDirectLink, (state, action) => {
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
      state.source = source;
    })
    .addCase(setHostMedia, (state, action) => {
      const [src, provider, id] = action.payload;
      let source: PlayerSource;
      switch (provider) {
        case Provider.youtube:
          // use id as fallback title, will update later
          source = { type: PlayerType.youtubeAPI, id, src };
          break;
        case Provider.bilibili:
          source = { type: PlayerType.bilibili, id, src };
          break;
        default:
          console.error("given url not supported: ", src, action.payload);
          return;
      }
      state.source = source;
    })
    .addCase(setObsidianMedia, (state, action) => {
      const [, src, type, track] = action.payload;
      const media: HTMLMediaSource = {
        src,
        type: mediaTypeToPlayerType(type),
        allowCORS: true,
        tracks: track ?? [],
      };
      state.source = media;
    })
    .addCase(renameObsidianMedia, (state, action) => {
      const source = selectSource(state);
      if (source.type === null) {
        throw new Error(
          "Failed to rename obsidian media source: no source set",
        );
      }
      const { src } = action.payload;
      source.src = src;
    })
    .addCase(switchToAudio, (state) => {
      const source = selectSource(state);
      if (isHTMLMediaSource(source)) {
        source.type = PlayerType.audio;
      } else {
        throw new TypeError("trying to switch to audio on non-html5 source");
      }
    })
    .addCase(unknownTypeDetermined, (state) => {
      const source = selectSource(state);
      if (source && source.type === PlayerType.unknown) {
        source.type = PlayerType.video;
      } else {
        console.error(
          "player source invaild to call unknownTypeDetermined: ",
          source,
        );
        throw new TypeError(
          "player source invaild to call unknownTypeDetermined: ",
        );
      }
    })
    .addCase(disableCORS, (state) => {
      const source = selectSource(state);
      if (isHTMLMediaSource(source)) {
        source.allowCORS = false;
      }
    });
};

export default { caseReducers, extraReducer };
