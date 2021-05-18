import MediaExtended from "main";
import { Handler } from "modules/handlers";
import { ExternalMediaView, EX_VIEW_TYPE } from "modules/media-view";
import { getSetupTool } from "modules/player-setup";
import { getVideoInfo, videoInfo } from "modules/video-host/video-info";
import { MarkdownPostProcessorContext } from "obsidian";

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

  private onclick(info: videoInfo) {
    return (e: MouseEvent) => {
      e.preventDefault();
      const workspace = this.plugin.app.workspace;

      const opened = workspace.getLeavesOfType(EX_VIEW_TYPE);

      const found = opened.find((leaf) =>
        (leaf.view as ExternalMediaView).isEqual(info),
      );

      if (found) {
        const view = found.view as ExternalMediaView;
        view.timeSpan = getSetupTool(this.hash).timeSpan;
        view.player.play();
      } else {
        const newLeaf = workspace.createLeafBySplit(workspace.activeLeaf);
        const view = new ExternalMediaView(newLeaf, info);
        newLeaf.open(view);
        view.player.once("ready", function () {
          this.play();
        });
      }
    };
  }

  /**
   * Update internal links to media file to respond to temporal fragments
   */
  handle() {
    const info = getVideoInfo(this.linktext);
    if (info) this.target.onclick = this.onclick(info);
  }
}
