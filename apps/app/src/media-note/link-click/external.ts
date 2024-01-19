import type MxPlugin from "@/mx-main";
import { parseUrl } from "../manager/url-info";

export async function onExternalLinkClick(
  this: MxPlugin,
  url: string,
  newLeaf: boolean,
  fallback: () => void,
) {
  const urlInfo = parseUrl(url);
  if (!urlInfo) {
    fallback();
    return;
  }
  await this.leafOpener.openMedia(urlInfo, newLeaf);
}
