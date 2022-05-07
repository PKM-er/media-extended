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

declare module "obsidian" {
  interface WorkspaceLeaf {
    activeTime: number;
  }
}

export const getMostRecentViewOfType = <T extends View>(
  ctor: Constructor<T>,
): T | null => {
  const leaf = getMostRecentLeafOfView(ctor);
  return leaf ? (leaf.view as T) : null;
};

export const getMostRecentLeafOfView = <T extends View>(
  ctor: Constructor<T>,
): WorkspaceLeaf | null => {
  if (app.workspace.activeLeaf?.view instanceof ctor)
    return app.workspace.activeLeaf;

  let recent: WorkspaceLeaf | null = null;
  app.workspace.iterateRootLeaves((leaf) => {
    if (
      leaf.view instanceof ctor &&
      (!recent || recent.activeTime < leaf.activeTime)
    ) {
      recent = leaf;
    }
  });
  return recent;
};

import { moment } from "obsidian";

const fillZero = (time: number, fractionDigits = 2) => {
  let main: string, frac: string | undefined;
  if (Number.isInteger(time)) {
    main = time.toString();
  } else {
    [main, frac] = time.toFixed(fractionDigits).split(".");
  }
  if (main.length === 1) main = "0" + main;
  return frac ? main + "." + frac : main;
};

export const secondToFragFormat = (_seconds: number | string) => {
  const duration = moment.duration(_seconds, "seconds");

  const hours = duration.hours(),
    minutes = duration.minutes(),
    seconds = duration.seconds() + duration.milliseconds() / 1e3;

  if (hours > 0) {
    return [hours, ...[minutes, seconds].map((num) => fillZero(num))].join(":");
  } else if (minutes > 0) {
    return [minutes, seconds].map((num) => fillZero(num)).join(":");
  } else if (seconds > 0) {
    return seconds.toFixed(2);
  } else {
    return "0";
  }
};

// no fill zero
export const secondToDuration = (_seconds: number | string) => {
  const duration = moment.duration(_seconds, "seconds");

  const hours = duration.hours(),
    minutes = duration.minutes(),
    seconds = duration.seconds() + duration.milliseconds() / 1e3;

  if (hours > 0) {
    return [hours, ...[minutes, seconds].map((num) => fillZero(num, 0))].join(
      ":",
    );
  } else if (minutes > 0) {
    return [minutes, fillZero(seconds, 0)].join(":");
  } else {
    return "0:" + fillZero(seconds, 0);
  }
};
