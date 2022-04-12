import "js-video-url-parser/lib/provider/youtube";

import { getMediaType, MediaType } from "@base/media-type";
import { AppDispatch, AppThunk, RootState } from "@player/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import urlParser from "js-video-url-parser/lib/base";
import { TFile } from "obsidian";
import Url from "url-parse";

import { reset as resetControls } from "./controls";
import { resetRatio } from "./interface";

interface Caption {
  src: string;
  kind: "captions";
  default: boolean;
}

type HTML5PlayerType = "unknown" | "audio" | "video";
type BrowserViewType = "browser-view";
interface SourceBase {
  playerType: HTML5PlayerType | BrowserViewType | "youtube" | "vimeo" | null;
  src: string;
  title: string;
  linkTitle?: string;
}

interface ObsidianMedia extends SourceBase {
  from: "obsidian";
  playerType: HTML5PlayerType;
  /** in-vault relative path for media file */
  path: string;
  filename: string;
}
interface DirectLinkMedia extends SourceBase {
  from: "direct";
  playerType: HTML5PlayerType;
}

interface VideoHostMediaBase extends SourceBase {
  from: "youtube" | "bilibili" | "vimeo" | "general";
  playerType: "youtube" | "vimeo" | BrowserViewType;
  id: string;
  title: string;
}

interface BilibiliMedia extends VideoHostMediaBase {
  from: "bilibili";
  playerType: BrowserViewType;
}
interface GeneralHostMedia extends VideoHostMediaBase {
  from: "bilibili";
  playerType: BrowserViewType;
}
interface YouTubeMedia extends VideoHostMediaBase {
  from: "youtube";
  playerType: "youtube";
}
interface VimeoMedia extends VideoHostMediaBase {
  from: "vimeo";
  playerType: "vimeo";
}

type Source = ObsidianMedia | DirectLinkMedia | BilibiliMedia | YouTubeMedia;

interface Subtitle {
  src: string;
  kind: "subtitles";
  // must be a valid BCP 47 language tag
  srcLang: string;
  label: string;
  default: boolean;
}

type Track = Caption | Subtitle;

export interface ProviderState {
  source: Source | null;
  tracks: Track[];
  /** null meaning feature not available */
  captureScreenshot: boolean | null;
}

const initialState: ProviderState = {
  source: null,
  tracks: [],
  captureScreenshot: null,
};

type SerializableTFile = Pick<
  TFile,
  "path" | "name" | "basename" | "extension"
>;

const serializeTFile = (file: TFile): SerializableTFile => {
  return {
    path: file.path,
    name: file.name,
    extension: file.extension,
    basename: file.basename,
  };
};

export const selectPlayerType = (state: RootState) =>
  state.provider.source?.playerType ?? null;

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
      state.captureScreenshot = type === "video" ? false : null;
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
      state.captureScreenshot = type === "video" ? false : null;
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
      state.captureScreenshot = null;
    },
    resetProvider: (state) => {
      state.source = initialState.source;
      state.tracks = initialState.tracks;
      state.captureScreenshot = null;
    },
    switchToAudio: (state) => {
      if (state.source?.playerType === "video") {
        state.source.playerType = "audio";
        state.captureScreenshot = null;
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
        state.captureScreenshot = false;
      } else {
        console.error("player source not available ", state.source);
      }
    },
    captureScreenshot: (state) => {
      if (state.captureScreenshot !== null) {
        state.captureScreenshot = true;
      }
    },
    captureScreenshotDone: (state) => {
      if (state.captureScreenshot !== null) {
        state.captureScreenshot = false;
      }
    },
  },
});

export const selectCaptureScreenshotRequested = (state: RootState) =>
  state.provider.captureScreenshot === true;

export const { switchToAudio } = providerSlice.actions;
const {
  setObsidianMedia: _ob,
  setDirectLink: _direct,
  setHostMedia: _host,
  resetProvider: _reset,
} = providerSlice.actions;
export const {
  captureScreenshot,
  captureScreenshotDone,
  unknownTypeDetermined,
} = providerSlice.actions;

const resetNonProvider = (dispatch: AppDispatch) => {
  dispatch(resetControls());
  dispatch(resetRatio());
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
      dispatch(_direct([src, mediaType]));
    } else {
      const info = urlParser.parse(url);
      if (info?.provider !== "youtube") {
        console.error("given url not supported: ", url);
        return;
      }
      resetNonProvider(dispatch);
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
