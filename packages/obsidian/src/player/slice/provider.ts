import "js-video-url-parser/lib/provider/youtube";

import { getMediaType, MediaType } from "@base/media-type";
import { AppDispatch, AppThunk, RootState } from "@player/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import urlParser from "js-video-url-parser/lib/base";
import { TFile } from "obsidian";
import Url from "url-parse";

import { canScreenshot, resetCanScreenshot } from "./action";
import { reset as resetControls } from "./controls";
import { resetRatio } from "./interface";
import {
  DirectLinkMedia,
  ObsidianMedia,
  Source,
  Track,
  YouTubeMedia,
} from "./provider-types";

export interface ProviderState {
  source: Source | null;
  tracks: Track[];
}

const initialState: ProviderState = {
  source: null,
  tracks: [],
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
        default:
          console.error("given url not supported: ", src);
          return;
      }
      state.source = media;
    },
    resetProvider: (state) => {
      state.source = initialState.source;
      state.tracks = initialState.tracks;
    },
    switchToAudio: (state) => {
      if (state.source?.playerType === "video") {
        state.source.playerType = "audio";
      } else {
        console.error(
          "unable to switch to audio for player type: " +
            state.source?.playerType,
        );
      }
    },
    unknownTypeDetermined: (state) => {
      if (state.source?.playerType) {
        if (state.source?.playerType !== "unknown") {
          return;
        }
        state.source.playerType = "video";
      } else {
        console.error("player source not available ", state.source);
      }
    },
  },
});

export const selectPlayerType = (state: RootState) =>
  state.provider.source?.playerType ?? null;

const {
  setObsidianMedia: _ob,
  setDirectLink: _direct,
  setHostMedia: _host,
  resetProvider: _reset,
  switchToAudio: _switchToAudio,
  unknownTypeDetermined: _unknownTypeDetermined,
} = providerSlice.actions;

export const switchToAudio = (): AppThunk => (dispatch) => {
    dispatch(canScreenshot(false));
    dispatch(_switchToAudio);
  },
  unknownTypeDetermined = (): AppThunk => (dispatch) => {
    dispatch(canScreenshot(true));
    dispatch(_unknownTypeDetermined);
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
      const info = urlParser.parse(url);
      if (info?.provider !== "youtube") {
        console.error("given url not supported: ", url);
        return;
      }
      resetNonProvider(dispatch);
      dispatch(canScreenshot(false));
      dispatch(_host([src, "youtube", info.id]));
    }
  };
export const resetProvider = (): AppThunk => async (dispatch) => {
  resetNonProvider(dispatch);
  dispatch(_reset());
};

export default providerSlice.reducer;

const stripHash = (url: string) => {
  const { hash } = Url(url);
  return hash.length > 0 ? url.slice(0, -hash.length) : url;
};

const serializeTFile = (file: TFile): SerializableTFile => {
  return {
    path: file.path,
    name: file.name,
    extension: file.extension,
    basename: file.basename,
  };
};
