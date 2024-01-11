import type { SupportedWebHost } from "./match-webpage";

export const titleParser: Record<SupportedWebHost, (title: string) => string> =
  {
    generic: (title) => title,
    bilibili: (title) => title.replace(/_哔哩哔哩_bilibili$/, ""),
  };
