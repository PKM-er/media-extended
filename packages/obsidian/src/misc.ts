import type { request } from "https";
import { FileSystemAdapter, MarkdownView, Platform } from "obsidian";
import Url from "url-parse";

import type MediaExtended from "./mx-main";

export type mutationParam = {
  callback: MutationCallback;
  option: MutationObserverInit;
};

export const filterDuplicates = (list: MutationRecord[]): MutationRecord[] => {
  const targets = list.map((v) => v.target);
  return list
    .reverse()
    .filter((item, index) => targets.indexOf(item.target) == index);
};

export type Await<T> = T extends {
  then(onfulfilled?: (value: infer U) => unknown): unknown;
}
  ? U
  : T;

export const getUrl = (src: string): URL | null => {
  try {
    return new URL(src);
  } catch (error) {
    // if url is invaild, do nothing and break current loop
    return null;
  }
};

export const mainpart = (url: URL) =>
  url.hash ? url.href.slice(0, -url.hash.length) : url.href;

export const setRatioWidth = (
  el: HTMLElement,
  maxHeight: string,
  ratio: number,
) => {
  el.style.setProperty("--max-ratio-width", `calc(${maxHeight} * ${ratio})`);
};

export const insertToCursor = (str: string, view: MarkdownView) => {
  const { editor, app } = view;
  const cursor = editor.getCursor("to");
  editor.replaceRange(str, cursor, cursor);
  if (app.isMobile)
    editor.setCursor(
      editor.offsetToPos(editor.posToOffset(cursor) + str.length),
    );
};

export const getBiliRedirectUrl = (id: string): Promise<string> =>
  new Promise((resolve, reject) => {
    if (Platform.isDesktopApp) {
      const req = (<typeof request>require("https").request)(
        { hostname: "b23.tv", port: 443, path: "/" + id, method: "GET" },
        (res) =>
          res.headers.location
            ? resolve(res.headers.location)
            : reject(new Error("No redirect location found")),
      );
      req.on("error", (err) => reject(err));
      req.end();
    } else
      reject(new TypeError("Calling node https in non-electron environment"));
  });

export type Size = [width: number, height: number];
const sizeSyntaxAllowedChar = /^[\d\sx]+$/,
  sizeDefPattern = /^\s*(\d+)\s*$/;
export const parseSizeSyntax = (str: string | undefined): Size | null => {
  if (!str || !sizeSyntaxAllowedChar.test(str)) return null;
  let [x, y, ...rest] = str.split("x");
  if (rest.length > 0) return null;
  x = x?.match(sizeDefPattern)?.[1]!;
  y = y?.match(sizeDefPattern)?.[1]!;
  if (!x && !y) return null;
  return [x ? parseInt(x) : -1, y ? parseInt(y) : -1];
};

export const parseSizeFromLinkTitle = (
  linkTitle: string,
): [title: string, size: Size | null] => {
  const pipeLoc = linkTitle.lastIndexOf("|");
  let size,
    title = linkTitle;
  if (pipeLoc === -1) {
    size = parseSizeSyntax(linkTitle);
    if (size) title = "";
  } else {
    size = parseSizeSyntax(title.substring(pipeLoc + 1));
    if (size) title = title.substring(0, pipeLoc);
  }
  return [title, size];
};

/**
 * get links that is safe to use in obsidian
 */
export const getLink = (url: string): string => {
  const { protocol } = Url(url);
  if (protocol === "file:") {
    return "app://local/" + url.substring("file:///".length);
  } else return url;
};

export const getPluginFullDir = (plugin: MediaExtended) => {
  const adapter = plugin.app.vault.adapter;
  if (plugin.manifest.dir && adapter instanceof FileSystemAdapter) {
    return adapter.getFullPath(plugin.manifest.dir);
  } else return undefined;
};
