import MediaExtended from "mx-main";
import {
  MarkdownPostProcessor,
  MarkdownView,
  parseLinktext,
  WorkspaceLeaf,
} from "obsidian";

import { MEDIA_VIEW_TYPE, MediaView } from "./media-view";
import { Await } from "./misc";
import {
  getMediaType,
  getVideoInfo,
  isInternal,
  resolveInfo,
  videoInfo,
} from "./modules/video-info";

type evtHandler = (e: Event) => void;

export const getOpenLink = (
  info: videoInfo,
  plugin: MediaExtended,
): evtHandler => {
  const { workspace } = plugin.app;
  return (e) => {
    e.stopPropagation();
    e.preventDefault();
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
      if (info) {
        if (view.isEqual(info)) {
          view.hash = isInternal(info) ? info.link.hash : info.src.hash;
          view.player.play();
        } else {
          view.player.once("ready", function () {
            this.play();
          });
          view.src = info;
        }
      }
    } else if (workspace.activeLeaf) {
      const newLeaf = workspace.createLeafBySplit(workspace.activeLeaf);
      workspace.activeLeaf.setGroupMember(newLeaf);
      const view = new MediaView(newLeaf, plugin, info);
      newLeaf.open(view);

      view.player.once("ready", function () {
        this.play();
      });
    }
  };
};

export const getLinkProcessor = (
  plugin: MediaExtended,
  type: "internal" | "external",
): MarkdownPostProcessor => {
  const selector = type === "internal" ? "a.internal-link" : "a.external-link";
  return (secEl, ctx) => {
    secEl.querySelectorAll(selector).forEach(async (el) => {
      const anchor = el as HTMLAnchorElement;
      const info = await resolveInfo(anchor, type, plugin.app, ctx);
      if (!info) return;

      plugin.registerDomEvent(anchor, "click", getOpenLink(info, plugin));
    });
  };
};

export const getCMLinkHandler = (plugin: MediaExtended) => {
  const { workspace, metadataCache, vault } = plugin.app;
  return async (e: MouseEvent, del: HTMLElement) => {
    const text = del.innerText;
    const isMacOS = /Macintosh|iPhone/.test(navigator.userAgent);
    const modKey = isMacOS ? e.metaKey : e.ctrlKey;
    if (modKey) {
      let info: Await<ReturnType<typeof getVideoInfo>>;
      if (del.hasClass("cm-hmd-internal-link")) {
        const { path, subpath: hash } = parseLinktext(text);

        if (!getMediaType(path)) return;
        else e.stopPropagation();

        const activeLeaf = workspace.getActiveViewOfType(MarkdownView);
        if (!activeLeaf) {
          console.error("no MarkdownView activeLeaf found");
          return;
        }
        const file = metadataCache.getFirstLinkpathDest(
          path,
          activeLeaf.file.path,
        );
        if (!file) return;
        info = await getVideoInfo(file, hash, vault);
      } else {
        if (
          del.hasClass("cm-formatting") &&
          del.hasClass("cm-formatting-link-string")
        ) {
          let urlEl: Element | null;
          if (text === "(") urlEl = del.nextElementSibling;
          else if (text === ")") urlEl = del.previousElementSibling;
          else urlEl = null;
          if (urlEl === null || !(urlEl instanceof HTMLElement)) {
            console.error("unable to get url from: %o", del);
            return;
          }
          info = await getVideoInfo(urlEl.innerText);
        } else {
          info = await getVideoInfo(text);
        }
      }

      try {
        if (info) getOpenLink(info, plugin)(e);
      } catch (e) {
        console.error(e);
      }
    }
  };
};
