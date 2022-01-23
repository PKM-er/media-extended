import parseUnit from "@tinyfe/parse-unit";
import type { request } from "https";
import { MarkdownView, Platform } from "obsidian";

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
  let [val, unit] = parseUnit(maxHeight);
  el.style.setProperty("--max-ratio-width", val * ratio + unit);
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
