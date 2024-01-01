/* eslint-disable @typescript-eslint/naming-convention */
export enum SupportedWebHost {
  Bilibili = "bilibili",
  Generic = "generic",
}

export const webHostDisplayName: Record<SupportedWebHost, string> = {
  [SupportedWebHost.Bilibili]: "Bilibili",
  [SupportedWebHost.Generic]: "Web",
};

export function matchHost(link: string | undefined): SupportedWebHost {
  if (!link) return SupportedWebHost.Generic;
  try {
    const url = new URL(link);
    if (url.hostname.endsWith(".bilibili.com")) {
      return SupportedWebHost.Bilibili;
    }
  } catch {
    // ignore
  }
  return SupportedWebHost.Generic;
}
