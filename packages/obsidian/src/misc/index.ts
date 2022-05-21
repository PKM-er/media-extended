import Url from "url-parse";

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

export const setRatioWidth = (
  el: HTMLElement,
  maxHeight: string,
  ratio: number,
) => {
  el.style.setProperty("--max-ratio-width", `calc(${maxHeight} * ${ratio})`);
};

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
