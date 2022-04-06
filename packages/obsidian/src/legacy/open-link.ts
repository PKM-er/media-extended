// @ts-nocheck
import { MediaInfo } from "@base/media-info";
import type MediaExtended from "@plugin";
import { MEDIA_VIEW_TYPE, MediaView, openNewView } from "@view";
import { MediaInfoType, MediaType } from "mx-lib";
import { WorkspaceLeaf } from "obsidian";

import { isAvailable } from "../feature/bili-bridge";

export const linkSelector = "span.cm-url, span.cm-hmd-internal-link";

const OpenLink = (
  info: MediaInfo,
  newLeaf: boolean,
  plugin: MediaExtended,
): void => {
  const { workspace } = plugin.app;
  if (
    info.from === MediaInfoType.Host &&
    info.host === "bilibili" &&
    (!isAvailable(plugin.app) || !plugin.settings.interalBiliPlayback)
  )
    return;
  if (!workspace.activeLeaf) {
    console.error("no active leaf");
    return;
  }
  const groupId: string | null = workspace.activeLeaf.group;
  let playerLeaf: WorkspaceLeaf | null = null;
  if (groupId) {
    const allPlayerLeavesInGroup = workspace
      .getLeavesOfType(MEDIA_VIEW_TYPE)
      .filter((leaf) => {
        return leaf.group === groupId;
      });
    if (allPlayerLeavesInGroup.length > 0)
      playerLeaf = allPlayerLeavesInGroup[0];
    for (let i = 1; i < allPlayerLeavesInGroup.length; i++) {
      allPlayerLeavesInGroup[i].detach();
    }
  }

  if (playerLeaf) {
    const view = playerLeaf.view as MediaView;
    const isInfoEqual = view.isEqual(info);
    view.setInfo(info).then(() => {
      if (!view.core) return;
      const { player } = view.core;
      if (isInfoEqual) {
        player.play();
      } else {
        if (
          info.from !== MediaInfoType.Host &&
          info.type === MediaType.Unknown &&
          player.isHTML5
        ) {
          player.once("ready", function () {
            const promise = this.play();
            let count = 0;
            if (promise) {
              promise.catch((e) => {
                const message =
                  "The play() request was interrupted by a new load request";
                if (count === 0 && (e.message as string)?.includes(message)) {
                  console.warn(e);
                  count++;
                } else console.error(e);
              });
            }
          });
        } else
          player.once("ready", function () {
            this.play();
          });
      }
    });
  } else if (workspace.activeLeaf) {
    openNewView(info, workspace.activeLeaf, plugin);
  }
};
export default OpenLink;
