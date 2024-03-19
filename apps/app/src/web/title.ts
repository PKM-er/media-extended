import type { MediaHost } from "../info/supported";

export const titleParser: Record<MediaHost, (title: string) => string> = {
  generic: (title) => title,
  bilibili: (title) =>
    title.replaceAll(
      /[-_]哔哩哔哩.+$|[-_]bilibili.+$|-(?:番剧|电影|纪录片|国创|电视剧|综艺)-.+/g,
      "",
    ),
  youtube: (title) => title.replace(/^\(\d+\) /, "").replace(/ - YouTube$/, ""),
  vimeo: (title) => title.replace(/ on Vimeo$/, ""),
  coursera: (title) => title.replace(/ \| Coursera$/, ""),
};
