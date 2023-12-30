import type { SupportedWebHost } from "./match";

export const titleParser: Record<SupportedWebHost, (title: string) => string> =
  {
    generic: (title) => title,
    bilibili: (title) => title.replace(/_哔哩哔哩_bilibili$/, ""),
  };
