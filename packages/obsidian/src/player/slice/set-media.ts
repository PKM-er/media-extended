import { parseLinktext, TFile } from "obsidian";

import { AppThunk } from "../store";
import { setHash } from "./controls/thunk";
import { setMediaUrlSrc, setObsidianMediaSrc } from "./provider/thunk";

export const getFileHashFromLinktext = (
  linktext: string,
  /** path of note that holds the link */
  sourcePath: string,
  file?: TFile,
): [file: TFile, hash: string] | null => {
  let { path, subpath: hash } = parseLinktext(linktext);
  if (!file) {
    let media = app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (!media || !(media instanceof TFile)) return null;
    file = media;
  }
  return [file, hash];
};

export const getInfoFromWarpper = (span: HTMLElement) => {
  const height = span.getAttribute("height"),
    width = span.getAttribute("width"),
    alt = span.getAttribute("alt");

  let linkTitle: string = "";

  if (height || width) {
    // size syntax supported by obsidian
    const sizeDeclaration = `${width}${height ? `x${height}` : ""}`;
    if (alt) linkTitle = `${alt}|${sizeDeclaration}`;
    else linkTitle = sizeDeclaration;
  } else if (alt) {
    linkTitle = alt;
  }

  const src = span.getAttribute("src");
  if (!src) return null;
  return { linktext: src, linkTitle };
};

export const setObsidianMedia =
  (file: TFile, hash: string, linkTitle?: string): AppThunk =>
  (dispatch) => {
    // const [title, _size] = parseSizeFromLinkTitle(alt);
    // link title to size/title
    dispatch(setObsidianMediaSrc(file));
    dispatch(setHash(hash));
  };

import { stripHash } from "@misc";
export const setMediaUrl =
  (url: string, linkTitle?: string): AppThunk =>
  (dispatch) => {
    // const [title, _size] = parseSizeFromLinkTitle(alt);
    // link title to size/title
    const [src, hash] = stripHash(url);
    dispatch(setMediaUrlSrc(src));
    dispatch(setHash(hash));
  };
