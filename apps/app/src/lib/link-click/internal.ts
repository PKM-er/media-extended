import { parseLinktext } from "obsidian";
import { MEDIA_FILE_VIEW_TYPE } from "@/media-view/file-view";
import type MxPlugin from "@/mx-main";
import { checkMediaType } from "@/patch/utils";
export function onInternalLinkClick(
  this: MxPlugin,
  linktext: string,
  sourcePath: string,
  newLeaf: boolean,
  fallback: () => void,
) {
  const { workspace, metadataCache } = this.app;
  const { path: linkpath, subpath } = parseLinktext(linktext);
  const linkFile = metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
  let mediaType;
  if (!linkFile || !(mediaType = checkMediaType(linkFile.extension))) {
    fallback();
    return;
  }
  const opened = workspace
    .getLeavesOfType(MEDIA_FILE_VIEW_TYPE[mediaType])
    .filter((l) => {
      const { file: filePath } = l.view.getState() as { file: string };
      return filePath === linkFile.path;
    });
  if (opened.length > 0 && !newLeaf) {
    opened[0].setEphemeralState({ subpath });
    return;
  }
  fallback();
}
