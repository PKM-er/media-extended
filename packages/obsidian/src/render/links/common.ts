import { openMediaFile, openMediaLink } from "@feature/open-media";
import type MediaExtended from "@plugin";
import { parseLinktext } from "obsidian";

export const onExternalLinkClick = (
  url: string,
  newLeaf: boolean,
  fallback: () => void,
) =>
  openMediaLink(url, true, newLeaf)
    .then((result) => result || fallback())
    .catch((error) => {
      console.error(error);
      fallback();
    });

export const onInternalLinkClick = async (
  linktext: string,
  sourcePath: string,
  newLeaf: boolean,
  fallback: () => void,
  plugin: MediaExtended,
) => {
  if (!plugin.settings.timestampLink) return fallback();
  try {
    const { metadataCache } = plugin.app,
      { path, subpath: hash } = parseLinktext(linktext),
      file = metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (!file || !(await openMediaFile(file, hash, true, newLeaf))) fallback();
  } catch (error) {
    console.error(error);
    fallback();
  }
};
