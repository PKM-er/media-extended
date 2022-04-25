import { MediaType } from "@base/media-type";
import {
  ActionReducerMapBuilder,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { TFile } from "obsidian";
import Url from "url-parse";

import {
  BilibiliMedia,
  DirectLinkMedia,
  ObsidianMedia,
  SerializableTFile,
  Source,
  Track,
  YouTubeMedia,
} from "./types";

export interface ProviderState {
  source: Source | null;
  tracks: Track[];
  renamed: { time: number } | null;
}

const initialState: ProviderState = {
  source: null,
  tracks: [],
  renamed: null,
};

export const getProviderSlice = (
  extraReducers?: (builder: ActionReducerMapBuilder<ProviderState>) => void,
) =>
  createSlice({
    name: "provider",
    initialState,
    reducers: {
      setObsidianMedia: (
        state,
        action: PayloadAction<
          [file: SerializableTFile, type: MediaType, tracks?: Track[]]
        >,
      ) => {
        const [file, type] = action.payload;
        const media: ObsidianMedia = {
          from: "obsidian",
          playerType: type,
          path: file.path,
          basename: file.basename,
          extension: file.extension,
          src: app.vault.getResourcePath(file as TFile),
          title: file.basename,
        };
        state.source = media;
      },
      renameObsidianMedia: (
        state,
        action: PayloadAction<{ file: SerializableTFile; currentTime: number }>,
      ) => {
        if (!state.source) {
          throw new Error(
            "Failed to rename obsidian media source: no source set",
          );
        }
        if (state.source.from !== "obsidian") {
          throw new Error(
            "Failed to rename obsidian media source: current source not from obsidian",
          );
        }
        const { file, currentTime } = action.payload;
        state.source.src = app.vault.getResourcePath(file as TFile);
        state.source.path = file.path;
        state.source.basename = file.basename;
        state.source.extension = file.extension;
        state.source.title = file.name;
        state.renamed = { time: currentTime };
      },
      renameStateReverted: (state) => {
        state.renamed = null;
      },
      setDirectLink: (
        state,
        action: PayloadAction<[src: string, type: MediaType]>,
      ) => {
        let [src, playerType] = action.payload;
        const { pathname } = Url(src),
          filename = decodeURI(pathname).split("/").pop();

        let isFileUrl = false;
        let url = src;
        src = src.replace(/^file:\/\//, () => {
          isFileUrl = true;
          return "app://local";
        });
        isFileUrl && (src += `?${Date.now()}`);

        const media: DirectLinkMedia = {
          from: "direct",
          playerType,
          src,
          url,
          title: filename ? filename : src,
        };
        state.source = media;
      },
      setHostMedia: (
        state,
        action: PayloadAction<[url: string, provider: string, id: string]>,
      ) => {
        const [src, provider, id] = action.payload;
        let media;
        switch (provider) {
          case "youtube":
            // use id as fallback title, will update later
            media = {
              from: provider,
              playerType: "youtube",
              id,
              title: null,
              src,
            } as YouTubeMedia;
            break;
          case "bilibili":
            media = {
              from: provider,
              playerType: "webview",
              id,
              title: null,
              src,
            } as BilibiliMedia;
            break;
          default:
            console.error("given url not supported: ", src, action.payload);
            return;
        }
        state.source = media;
      },
      resetProvider: (state) => {
        state.source = initialState.source;
        state.tracks = initialState.tracks;
      },
      switchToAudio: (state) => {
        if (state.source) {
          state.source.playerType = "audio";
        }
      },
      unknownTypeDetermined: (state) => {
        if (state.source && state.source.playerType === "unknown") {
          state.source.playerType = "video";
        } else {
          console.error(
            "player source invaild to call unknownTypeDetermined: ",
            state.source,
          );
        }
      },
    },
    extraReducers,
  });
export default getProviderSlice().actions;
