import { Platform } from "obsidian";

/**
 * @see https://github.com/th-ch/youtube-music/blob/5a93a04b61a38745788e8c2077789232d72db1aa/src/index.ts#L447-L452
 */
const uaList = {
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 12.1; rv:95.0) Gecko/20100101 Firefox/95.0",
  windows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0",
  linux: "Mozilla/5.0 (Linux x86_64; rv:95.0) Gecko/20100101 Firefox/95.0",
};

export function getUserAgent(_ua: string) {
  if (Platform.isWin) {
    return uaList.windows;
  }
  if (Platform.isMacOS) {
    return uaList.mac;
  }
  if (Platform.isLinux) {
    return uaList.linux;
  }
  return uaList.windows;
  // return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
  // return ua.replaceAll(/(?:Electron|obsidian)\/\S+ ?/g, "");
}
