import type { TFile, Workspace } from "obsidian";
import { parseLinktext } from "obsidian";
import { MEDIA_FILE_VIEW_TYPE } from "@/media-view/file-view";
import type MxPlugin from "@/mx-main";
import type { MediaType } from "@/patch/utils";
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
  if (
    !newLeaf &&
    openInOpenedPlayer({ file: linkFile, subpath, mediaType }, workspace)
  ) {
    return;
  }
  fallback();
}

export function openInOpenedPlayer(
  linkInfo: { file: TFile; subpath: string; mediaType: MediaType },
  workspace: Workspace,
) {
  const opened = workspace
    .getLeavesOfType(MEDIA_FILE_VIEW_TYPE[linkInfo.mediaType])
    .filter((l) => {
      const { file: filePath } = l.view.getState() as { file: string };
      return filePath === linkInfo.file.path;
    });
  if (opened.length > 0) {
    opened[0].setEphemeralState({ subpath: linkInfo.subpath });
    return true;
  }
  return false;
}
