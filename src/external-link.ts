import MediaExtended from "main";
import { Handler } from "modules/handlers";
import { ExternalMediaView, EX_VIEW_TYPE } from "modules/media-view";
import { getVideoInfo, videoInfo } from "modules/video-host/video-info";
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
  const handler = new ExternalLinkHandler(this, ctx);
  for (const el of docEl.querySelectorAll("a.external-link")) {
    const anchor = el as HTMLAnchorElement;
    handler.setTarget(anchor).handle();
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
    plugin: MediaExtended,
    ctx: MarkdownPostProcessorContext,
    target?: HTMLAnchorElement,
  ) {
    super(target ?? createEl("a"));
    this.plugin = plugin;
    this.ctx = ctx;
  }

  public get linktext(): string {
    return this.target.href;
  }

  /**
   * Update internal links to media file to respond to temporal fragments
   */
  handle() {
    const info = getVideoInfo(this.linktext);
    if (info) this.target.onclick = onclick(info, this.plugin.app.workspace);
  }
}

export function onclick(info: videoInfo, workspace: Workspace) {
  return (e: Event) => {
    e.preventDefault();
    // @ts-ignore
    const groupId: string | null = workspace.activeLeaf.group;
    let playerLeaf: WorkspaceLeaf | null = null;
    if (groupId) {
      const allPlayerLeavesInGroup = workspace
        .getLeavesOfType(EX_VIEW_TYPE)
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
      const view = playerLeaf.view as ExternalMediaView;
      if (info) {
        if (view.isEqual(info)) {
          view.src = info;
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
      const view = new ExternalMediaView(newLeaf, info);
      newLeaf.open(view);

      view.player.once("ready", function () {
        this.play();
      });
    }
  };
}
