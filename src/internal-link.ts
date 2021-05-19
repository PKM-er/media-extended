import { onclick } from "external-link";
import MediaExtended from "main";
import { Handler } from "modules/handlers";
import { mutationParam, filterDuplicates } from "modules/misc";
import { getSetupTool } from "modules/player-setup";
import { getVideoInfo } from "modules/video-host/video-info";
import { MarkdownPostProcessorContext, FileView } from "obsidian";

/** Process internal link to media files with hash */
export function processInternalLinks(
  this: MediaExtended,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  const internalLink: mutationParam = {
    // check if link is resolved
    callback: (list, obs) => {
      for (const m of filterDuplicates(list)) {
        const a = m.target as HTMLAnchorElement;
        if (!a.hasClass("is-unresolved"))
          new InternalLinkHandler(a, this, ctx).handle();
        obs.disconnect();
      }
    },
    option: { attributeFilter: ["class"], attributeOldValue: true },
  };

  for (const link of el.querySelectorAll("a.internal-link")) {
    const ilObs = new MutationObserver(internalLink.callback);
    ilObs.observe(link, internalLink.option);
  }
}

// <a
//   data-href="test.mp4#1"
//   href="test.mp4#1"
//   class="internal-link"
//   target="_blank"
//   rel="noopener"
//   >test.mp4 > 1</a
// >
export class InternalLinkHandler extends Handler<HTMLAnchorElement> {
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
    let srcLinktext = this.target.dataset.href;
    if (!srcLinktext) {
      console.error(this.target);
      throw new Error("no href found in a.internal-link");
    } else return srcLinktext;
  }

  /**
   * Update internal links to media file to respond to temporal fragments
   */
  async handle() {
    const matchedFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
      this.link,
      this.ctx.sourcePath,
    );
    if (!matchedFile) throw new Error("No file found for link: " + this.link);
    const info = await getVideoInfo(
      matchedFile,
      this.hash,
      this.plugin.app.vault,
    );
    if (info) {
      this.target.onclick = onclick(info, this.plugin.app.workspace);
    }
  }
}
