import { getMediaType } from "@base/media-type";
import parseURL from "@base/url-parse";
import { stripHash } from "@misc";
import { AppDispatch, AppThunk } from "@player/store";
import assertNever from "assert-never";
import type { TFile } from "obsidian";

import { canScreenshot, resetCanScreenshot } from "../action";
import { fetchBiliMeta } from "../async-thunk/bilibili";
import fetchYoutubeMeta from "../async-thunk/fetch-ytb-meta";
import { reset as resetControls } from "../controls";
import { resetRatio } from "../interface";
import { getProviderSlice } from "./slice";
import { SerializableTFile } from "./types";

const {
  setObsidianMedia: _ob,
  renameObsidianMedia: _renameOb,
  setDirectLink: _direct,
  setHostMedia: _host,
  resetProvider: _reset,
  switchToAudio: _switchToAudio,
  unknownTypeDetermined: _unknownTypeDetermined,
} = getProviderSlice().actions;

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
    const [src] = stripHash(url);
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
      switch (result.provider) {
        case "youtube":
          dispatch(fetchYoutubeMeta(result.id));
          break;
        case "bilibili":
          dispatch(fetchBiliMeta(result.id));
          break;
        case "vimeo":
          throw new Error("Not implemented");
        default:
          assertNever(result.provider);
      }
    }
  };
export const resetProvider = (): AppThunk => async (dispatch) => {
  resetNonProvider(dispatch);
  dispatch(_reset());
};

const serializeTFile = (file: TFile): SerializableTFile => {
  return {
    path: file.path,
    name: file.name,
    extension: file.extension,
    basename: file.basename,
  };
};
