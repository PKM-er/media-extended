import MediaExtended from "main";
import { Handler } from "modules/handlers";
import { mutationParam, filterDuplicates } from "modules/misc";
import { getSetupTool } from "modules/player-setup";
import { MarkdownPostProcessorContext, FileView } from "obsidian";

/** Process internal link to media files with hash */
export function processInternalLinks(
  this: MediaExtended,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  const handler = new InternalLinkHandler(this, ctx);
  const internalLink: mutationParam = {
    // check if link is resolved
    callback: (list, obs) => {
      for (const m of filterDuplicates(list)) {
        const a = m.target as HTMLAnchorElement;
        if (!a.hasClass("is-unresolved")) handler.setTarget(a).handle();
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
    plugin: MediaExtended,
    ctx: MarkdownPostProcessorContext,
    target?: HTMLAnchorElement,
  ) {
    super(target ?? createEl("a"));
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

  private onclick = (setupPlayer: any) => (e: MouseEvent) => {
    const workspace = this.plugin.app.workspace;

    const openedMedia: HTMLElement[] = [];

    const matchedFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
      this.link,
      this.ctx.sourcePath,
    );
    if (!matchedFile) throw new Error("No file found for link: " + this.link);

    workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof FileView && leaf.view.file === matchedFile)
        openedMedia.push(leaf.view.contentEl);
    });

    if (openedMedia.length) openedMedia.forEach((e) => setupPlayer(e));
    else {
      const fileLeaf = workspace.createLeafBySplit(workspace.activeLeaf);
      fileLeaf.openFile(matchedFile).then(() => {
        if (fileLeaf.view instanceof FileView)
          setupPlayer(fileLeaf.view.contentEl);
      });
    }
  };

  /**
   * Update internal links to media file to respond to temporal fragments
   */
  handle() {
    const { timeSpan, setPlayerTF, setHashOpt } = getSetupTool(this.hash);

    // skip if timeSpan is missing or invalid
    if (!timeSpan) return;

    const newLink = createEl("a", {
      cls: "internal-link",
      text: this.target.innerText,
    });

    const setupPlayer = (e: HTMLElement): void => {
      // prettier-ignore
      const player = e.querySelector(
          "div.video-container > video, " +
          "div.audio-container > audio, " +
          "div.video-container > audio" // for webm audio
        ) as HTMLMediaElement;
      if (!player) throw new Error("no player found in FileView");
      setHashOpt(player);
      setPlayerTF(player);
      player.play();
    };

    newLink.onclick = this.onclick(setupPlayer);
    this.replaceWith(newLink);
  }
}
