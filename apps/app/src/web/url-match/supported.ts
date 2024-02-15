/* eslint-disable @typescript-eslint/naming-convention */

import { omit } from "@/lib/pick";

export const enum MediaHost {
  Bilibili = "bilibili",
  YouTube = "youtube",
  Vimeo = "vimeo",
  Coursera = "coursera",
  Generic = "generic",
}

export type SupportedMediaHost = Exclude<MediaHost, MediaHost.Generic>;

export const mediaHostUrl: Record<SupportedMediaHost, string> = {
  [MediaHost.Bilibili]: "https://www.bilibili.com",
  [MediaHost.YouTube]: "https://www.youtube.com",
  [MediaHost.Vimeo]: "https://www.vimeo.com",
  [MediaHost.Coursera]: "https://www.coursera.org",
};

export const mediaHostDisplayName: Record<MediaHost, string> = {
  [MediaHost.Bilibili]: "bilibili",
  [MediaHost.YouTube]: "YouTube",
  [MediaHost.Generic]: "Website",
  [MediaHost.Vimeo]: "Vimeo",
  [MediaHost.Coursera]: "Coursera",
};

export const noGeneric = (labels: Record<MediaHost, string>) =>
  omit(labels, [MediaHost.Generic]);
