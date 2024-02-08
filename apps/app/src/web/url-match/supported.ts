/* eslint-disable @typescript-eslint/naming-convention */

import { omit } from "@/lib/pick";

export const enum SupportedMediaHost {
  Bilibili = "bilibili",
  YouTube = "youtube",
  Vimeo = "vimeo",
  Generic = "generic",
}

export type SupportedHostNoGeneric = Exclude<
  SupportedMediaHost,
  SupportedMediaHost.Generic
>;

export const mediaHostUrl: Record<SupportedHostNoGeneric, string> = {
  [SupportedMediaHost.Bilibili]: "https://www.bilibili.com",
  [SupportedMediaHost.YouTube]: "https://www.youtube.com",
  [SupportedMediaHost.Vimeo]: "https://www.viemo.com",
};

export const mediaHostDisplayName: Record<SupportedMediaHost, string> = {
  [SupportedMediaHost.Bilibili]: "bilibili",
  [SupportedMediaHost.YouTube]: "YouTube",
  [SupportedMediaHost.Generic]: "Website",
  [SupportedMediaHost.Vimeo]: "Viemo",
};

export const noGeneric = (labels: Record<SupportedMediaHost, string>) =>
  omit(labels, [SupportedMediaHost.Generic]);
