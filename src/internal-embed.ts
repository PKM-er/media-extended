import MediaExtended from "main";
import { Handler } from "modules/handlers";
import { mutationParam, filterDuplicates, Await } from "modules/misc";
import { setPlyr, getSetupTool } from "modules/player-setup";
import { getSubtitleTracks, SubtitleResource } from "modules/subtitle";
import { MarkdownPostProcessorContext } from "obsidian";

/** Process internal media embeds with hash */
export function processInternalEmbeds(
  this: MediaExtended,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  const allEmbeds = el.querySelectorAll("span.internal-embed");
  if (allEmbeds) {
    const handler = new InternalEmbedHandler(this, ctx);
    const internalEmbed: mutationParam = {
      callback: (list, obs) => {
        for (const mutation of filterDuplicates(list)) {
          const span = mutation.target as HTMLSpanElement;
          if (span.hasClass("is-loaded") && !span.hasClass("mod-empty")) {
            if (span.hasClass("media-embed")) handler.setTarget(span).handle();
            obs.disconnect();
          }
        }
      },
      option: { attributeFilter: ["class"] },
    };

    for (const span of allEmbeds) {
      const ieObs = new MutationObserver(internalEmbed.callback);
      ieObs.observe(span, internalEmbed.option);
    }
  }
}

// <span alt="a.mp4 > 1" src="a.mp4#1" class="internal-embed ..." >
//   <video controls="" src="" ></video >
// </span>
class InternalEmbedHandler extends Handler<HTMLSpanElement> {
  plugin: MediaExtended;
  ctx: MarkdownPostProcessorContext;

  constructor(
    plugin: MediaExtended,
    ctx: MarkdownPostProcessorContext,
    target?: HTMLSpanElement,
  ) {
    super(target ?? createEl("a"));
    this.plugin = plugin;
    this.ctx = ctx;
  }

  public get linktext(): string {
    const src = this.target.getAttr("src");
    if (src) return src;
    else throw new Error("no linktext found in span");
  }

  private setupPlayer(
    mediaEl: HTMLMediaElement,
    trackInfo: Await<ReturnType<typeof getSubtitleTracks>>,
    isWebm = false,
  ): HTMLDivElement {
    const container = createDiv({ cls: "local-media" });
    this.target.appendChild(container);

    let target: HTMLMediaElement;
    if (!isWebm) target = mediaEl;
    // setup plyr to a cloned mediaEl,
    // keep original <video> intact to observe if <audio> is added
    else {
      target = mediaEl.cloneNode(true) as typeof mediaEl;
      mediaEl.addClass("visuallyhidden");
    }
    setPlyr(
      container,
      target,
      getSetupTool(this.hash),
      undefined,
      trackInfo?.tracks,
    );
    this.ctx.addChild(
      new SubtitleResource(container, trackInfo?.objUrls ?? []),
    );
    return container;
  }

  /**
   * Update media embeds to respond to temporal fragments
   */
  async handle() {
    if (!(this.target.firstElementChild instanceof HTMLMediaElement)) {
      console.error(
        "first element not player: %o",
        this.target.firstElementChild,
      );
      return;
    }
    const srcMediaEl = this.target.firstElementChild;

    const isWebm = this.link.endsWith(".webm");

    const videoFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
      this.link,
      this.ctx.sourcePath,
    );
    if (!videoFile) throw new Error("No file found for link: " + this.link);

    const trackInfo = await getSubtitleTracks(videoFile, this.plugin);

    const newMediaContainer = this.setupPlayer(srcMediaEl, trackInfo, isWebm);

    const webmEmbed: mutationParam = {
      /** setup webm audio player */
      callback: (list, obs) => {
        list.forEach((m) => {
          // when new <audio> is added,
          // remove video container previously created
          if (m.addedNodes.length)
            newMediaContainer.parentElement?.removeChild(newMediaContainer);
          m.addedNodes.forEach((node) => {
            if (node instanceof HTMLMediaElement) {
              this.setupPlayer(node, trackInfo);
              obs.disconnect();
              return;
            }
          });
        });
      },
      option: {
        childList: true,
      },
    };

    if (isWebm) {
      const webmObs = new MutationObserver(webmEmbed.callback);
      // observe if <audio> is added to replace <video>
      webmObs.observe(this.target, webmEmbed.option);
      // if <video> is not added, remove preserved <video>
      // keep only the configured plyr
      setTimeout(() => {
        if (srcMediaEl.parentElement)
          srcMediaEl.parentElement.removeChild(srcMediaEl);
      }, 800);
    }
  }
}
