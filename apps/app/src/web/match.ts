export type SupportedWebHost = "bilibili" | "generic";

export function matchHost(url: URL): SupportedWebHost {
  if (url.hostname.endsWith(".bilibili.com")) {
    return "bilibili";
  }
  return "generic";
}
