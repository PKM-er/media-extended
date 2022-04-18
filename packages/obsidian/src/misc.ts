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

export const stripHash = (url: string): [url: string, hash: string] => {
  const { hash } = Url(url);
  url = hash.length > 0 ? url.slice(0, -hash.length) : url;
  return [url, hash];
};

export const setRatioWidth = (
  el: HTMLElement,
  maxHeight: string,
  ratio: number,
) => {
  el.style.setProperty("--max-ratio-width", `calc(${maxHeight} * ${ratio})`);
};

export const insertToCursor = async (str: string, view: MarkdownView) => {
  const { editor } = view;
  const cursor = editor.getCursor("to");
  if (view.getMode() === "source") {
    editor.replaceRange(str, cursor, cursor);
    editor.setCursor(
      editor.offsetToPos(editor.posToOffset(cursor) + str.length),
    );
  } else {
    const pos = editor.posToOffset(cursor),
      doc = editor.getValue();
    return app.vault.modify(
      view.file,
      doc.slice(0, pos) + str + doc.slice(pos),
    );
  }
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

import { App, Constructor, View, WorkspaceLeaf } from "obsidian";

export const getMostRecentViewOfType = <T extends View>(
  ctor: Constructor<T>,
  app: App,
): T | null => {
  let activeView = app.workspace.getActiveViewOfType(ctor);
  if (activeView) return activeView;

  let recent: WorkspaceLeaf | undefined;
  app.workspace.iterateRootLeaves((leaf) => {
    if (
      leaf.view instanceof ctor &&
      (!recent || recent.activeTime < leaf.activeTime)
    ) {
      recent = leaf;
    }
  });
  if (recent) return recent.view as T;
  return null;
};
