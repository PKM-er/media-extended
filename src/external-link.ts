import MediaExtended from "main";
import { Handler } from "modules/handlers";
import { MediaView, MEDIA_VIEW_TYPE } from "modules/media-view";
import {
  getVideoInfo,
  isInternal,
  videoInfo,
} from "modules/video-host/video-info";
import {
  MarkdownPostProcessorContext,
  Workspace,
  WorkspaceLeaf,
} from "obsidian";

export function processExternalLinks(
  this: MediaExtended,
  docEl: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  for (const el of docEl.querySelectorAll("a.external-link")) {
    const anchor = el as HTMLAnchorElement;
    new ExternalLinkHandler(anchor, this, ctx).handle();
  }
}

// <a
//   href="https://example.com/test.mp4#1"
//   class="external-link"
//   target="_blank"
//   rel="noopener"
//   >text</a
// >
export class ExternalLinkHandler extends Handler<HTMLAnchorElement> {
  plugin: MediaExtended;
  ctx: MarkdownPostProcessorContext;

  constructor(
    target: HTMLAnchorElement,
    plugin: MediaExtended,
    ctx: MarkdownPostProcessorContext,
  ) {
    super(target);
    this.plugin = plugin;
    this.ctx = ctx;
  }

  public get linktext(): string {
    return this.target.href;
  }

  /**
   * Update internal links to media file to respond to temporal fragments
   */
  async handle() {
    const info = await getVideoInfo(this.linktext);
    if (info) this.target.onclick = onclick(info, this.plugin.app.workspace);
  }
}

export function onclick(info: videoInfo, workspace: Workspace) {
  return (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    // @ts-ignore
    const groupId: string | null = workspace.activeLeaf.group;
    let playerLeaf: WorkspaceLeaf | null = null;
    if (groupId) {
      const allPlayerLeavesInGroup = workspace
        .getLeavesOfType(MEDIA_VIEW_TYPE)
        .filter((leaf) => {
          // @ts-ignore
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
    } else {
      const newLeaf = workspace.createLeafBySplit(workspace.activeLeaf);
      workspace.activeLeaf.setGroupMember(newLeaf);
      const view = new MediaView(newLeaf, info);
      newLeaf.open(view);

      view.player.once("ready", function () {
        this.play();
      });
    }
  };
}
