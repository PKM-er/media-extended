import parseUnit from "@tinyfe/parse-unit";
import { App } from "obsidian";

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

// @ts-ignore
export const getIsMobile = (app: App) => app.isMobile as boolean;

export const setRatioWidth = (
  el: HTMLElement,
  maxHeight: string,
  ratio: number,
) => {
  let [val, unit] = parseUnit(maxHeight);
  el.style.setProperty("--max-ratio-width", val * ratio + unit);
};
