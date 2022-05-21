import getTracks from "@feature/subtitle";
import assertNever from "assert-never";
import { getMediaType, parseURL, stripHash } from "mx-base";
import { Provider } from "mx-base";
import { SerializableTFile } from "mx-store";
import {
  renameObsidianMedia as _renameOb,
  setDirectLink,
  setHostMedia,
  setObsidianMedia,
} from "mx-store";
import { AppThunk } from "mx-store";
import type { TFile } from "obsidian";

import { fetchBiliMeta, fetchYoutubeMeta } from "./fetch-meta";

export const renameObsidianMedia =
  (file: TFile): AppThunk =>
  (dispatch, getState) => {
    // const { currentTime } = getState().controls;
    dispatch(
      _renameOb({
        file: serializeTFile(file),
        src: app.vault.getResourcePath(file),
      }),
    );
  };

export const setObsidianMediaSrc =
  (file: TFile): AppThunk =>
  async (dispatch, getState) => {
    const mediaType = getMediaType(file);
    if (!mediaType) {
      console.error("given TFile not media");
      return;
    }
    const { meta } = getState();
    if (meta.provider === Provider.obsidian && meta.file.path === file.path) {
      return; // if file is the same, skip
    }
    dispatch(
      setObsidianMedia([
        serializeTFile(file),
        app.vault.getResourcePath(file),
        mediaType,
        await getTracks(file, localStorage.language || "en"),
      ]),
    );
  };
export const setMediaUrlSrc =
  (url: string): AppThunk =>
  async (dispatch, getState) => {
    const { meta, source } = getState();
    const [src] = stripHash(url);
    if (
      (meta.provider === Provider.html5 && meta.url === src) ||
      (meta.provider !== Provider.obsidian && source.src === src)
    ) {
      return; // if url is the same, skip
    }
    const mediaType = getMediaType(url);
    if (mediaType) {
      dispatch(setDirectLink([src, mediaType]));
    } else {
      const result = parseURL(url);
      if (!result) {
        console.error("given url not supported: ", url);
        return;
      }
      dispatch(setHostMedia([src, result.provider, result.id]));
      switch (result.provider) {
        case Provider.youtube:
          dispatch(fetchYoutubeMeta(result.id));
          break;
        case Provider.bilibili:
          dispatch(fetchBiliMeta(result.id));
          break;
        case Provider.vimeo:
        case Provider.generalHost:
          throw new Error("Not implemented");
        default:
          assertNever(result.provider);
      }
    }
  };

const serializeTFile = (file: TFile): SerializableTFile => ({
  path: file.path,
  name: file.name,
  extension: file.extension,
  basename: file.basename,
});
