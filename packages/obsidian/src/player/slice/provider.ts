import { getMediaType, MediaType } from "@base/media-type";
import parseURL from "@base/url-parse";
import { stripHash } from "@misc";
import { AppDispatch, AppThunk, RootState } from "@player/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TFile } from "obsidian";
import Url from "url-parse";

import { canScreenshot, resetCanScreenshot } from "./action";
import { reset as resetControls } from "./controls";
import { resetRatio } from "./interface";
import {
  BilibiliMedia,
  DirectLinkMedia,
  ObsidianMedia,
  Source,
  Track,
  YouTubeMedia,
} from "./provider-types";

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

type SerializableTFile = Pick<
  TFile,
  "path" | "name" | "basename" | "extension"
>;

export const providerSlice = createSlice({
  name: "provider",
  initialState,
  reducers: {
    setObsidianMedia: (
      state,
      action: PayloadAction<[file: SerializableTFile, type: MediaType]>,
    ) => {
      const [file, type] = action.payload;
      const media: ObsidianMedia = {
        from: "obsidian",
        playerType: type,
        path: file.path,
        filename: file.name,
        src: app.vault.getResourcePath(file as TFile),
        title: file.name,
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
      state.source.filename = file.name;
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
      const [src, type] = action.payload;
      const { pathname } = Url(src),
        filename = decodeURI(pathname).split("/").pop();
      const media: DirectLinkMedia = {
        from: "direct",
        playerType: type,
        src,
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
            title: id,
            src,
          } as YouTubeMedia;
          break;
        case "bilibili":
          media = {
            from: provider,
            playerType: "webview",
            id,
            title: id,
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
});

export const selectPlayerType = (state: RootState) =>
  state.provider.source?.playerType ?? null;

export const { renameStateReverted } = providerSlice.actions;
const {
  setObsidianMedia: _ob,
  renameObsidianMedia: _renameOb,
  setDirectLink: _direct,
  setHostMedia: _host,
  resetProvider: _reset,
  switchToAudio: _switchToAudio,
  unknownTypeDetermined: _unknownTypeDetermined,
} = providerSlice.actions;

export const renameObsidianMedia =
  (file: TFile): AppThunk =>
  (dispatch, getState) => {
    const { currentTime } = getState().controls;
    dispatch(_renameOb({ file: serializeTFile(file), currentTime }));
  };

export const switchToAudio = (): AppThunk => (dispatch, getState) => {
    const { provider } = getState();
    if (
      provider.source?.playerType === "unknown" ||
      provider.source?.playerType === "video"
    ) {
      dispatch(canScreenshot(false));
      dispatch(_switchToAudio());
    } else {
      console.error(
        "unable to switch to audio for player type: " +
          provider.source?.playerType,
      );
    }
  },
  unknownTypeDetermined = (): AppThunk => (dispatch, getState) => {
    if (getState().provider.source?.playerType === "unknown") {
      dispatch(canScreenshot(true));
      dispatch(_unknownTypeDetermined());
    }
  };

const resetNonProvider = (dispatch: AppDispatch) => {
  dispatch(resetControls());
  dispatch(resetRatio());
  dispatch(resetCanScreenshot());
};

export const setObsidianMediaSrc =
  (file: TFile): AppThunk =>
  async (dispatch, getState) => {
    const mediaType = getMediaType(file);
    if (!mediaType) {
      console.error("given TFile not media");
      return;
    }
    const { source } = getState().provider;
    if (source?.from === "obsidian" && source.path === file.path) {
      return; // if file is the same, skip
    }
    resetNonProvider(dispatch);
    dispatch(canScreenshot(mediaType === "video"));
    dispatch(_ob([serializeTFile(file), mediaType]));
  };
export const setMediaUrlSrc =
  (url: string): AppThunk =>
  async (dispatch, getState) => {
    const { source } = getState().provider;
    const src = stripHash(url);
    if (source?.src === src) return;
    const mediaType = getMediaType(url);
    if (mediaType) {
      resetNonProvider(dispatch);
      dispatch(canScreenshot(mediaType === "video"));
      dispatch(_direct([src, mediaType]));
    } else {
      let screenshotSupported = false;
      const result = parseURL(url);
      if (!result) {
        console.error("given url not supported: ", url);
        return;
      }
      if (result.provider === "bilibili") {
        screenshotSupported = true;
      }
      resetNonProvider(dispatch);
      dispatch(canScreenshot(screenshotSupported));
      dispatch(_host([src, result.provider, result.id]));
    }
  };
export const resetProvider = (): AppThunk => async (dispatch) => {
  resetNonProvider(dispatch);
  dispatch(_reset());
};

export default providerSlice.reducer;

const serializeTFile = (file: TFile): SerializableTFile => {
  return {
    path: file.path,
    name: file.name,
    extension: file.extension,
    basename: file.basename,
  };
};
