import type { SupportedMediaHost } from "./url-match/supported";

export const titleParser: Record<
  SupportedMediaHost,
  (title: string) => string
> = {
  generic: (title) => title,
  bilibili: (title) => title.replace(/_哔哩哔哩_bilibili$/, ""),
  youtube: (title) => title.replace(/ - YouTube$/, ""),
  vimeo: (title) => title.replace(/ on Vimeo$/, ""),
  coursera: (title) => title.replace(/ \| Coursera$/, ""),
};
