import MediaExtended from "main";
import {
  FileView,
  MarkdownPostProcessorContext,
  parseLinktext,
} from "obsidian";
import { Await, mutationParam } from "./misc";
import { getSetupTool, setPlyr } from "./player-setup";
import { getSubtitleTracks, SubtitleResource } from "./subtitle";
import { getPlayer } from "./video-host/get-player";

type mediaType = "audio" | "video";
const acceptedExt: Map<mediaType, string[]> = new Map([
  ["audio", ["mp3", "wav", "m4a", "ogg", "3gp", "flac"]],
  ["video", ["mp4", "webm", "ogv"]],
]);

function getUrl(src: string): URL | null {
  try {
    return new URL(src);
  } catch (error) {
    // if url is invaild, do nothing and break current loop
    return null;
  }
}

abstract class Handler<T extends HTMLElement> {
  target: T;
  plugin?: MediaExtended;
  ctx?: MarkdownPostProcessorContext;

  constructor(
    target: T,
    plugin?: MediaExtended,
    ctx?: MarkdownPostProcessorContext,
  ) {
    this.target = target;
    this.plugin = plugin;
    this.ctx = ctx;
  }

  setTarget(target: T): this {
    this.target = target;
    return this;
  }

  /** raw link */
  public abstract get linktext(): string;

  /** link without hash */
  public get link(): string {
    return parseLinktext(this.linktext).path;
  }
  public get hash(): string {
    return parseLinktext(this.linktext).subpath;
  }

  protected replaceWith(newEl: HTMLElement) {
    if (this.target.parentNode) {
      this.target.parentNode.replaceChild(newEl, this.target);
    } else {
      console.error(this.target);
      throw new Error("parentNode of img not found");
    }
  }
}

export class ExternalEmbedHandler extends Handler<HTMLImageElement> {
  constructor(target?: HTMLImageElement) {
    if (target) super(target);
    else super(createEl("img"));
  }

  public get linktext(): string {
    return this.target.src;
  }

  doDirectLink(): this | null {
    const url = getUrl(this.linktext);
    if (!url) return this;

    // if url contains no extension, type = null
    let fileType: mediaType | null = null;
    if (url.pathname.includes(".")) {
      const ext = url.pathname.split(".").pop() as string;
      for (const [type, extList] of acceptedExt) {
        if (extList.includes(ext)) fileType = type;
      }
    }

    if (fileType) {
      const playerEl = createEl(fileType);
      playerEl.src = this.link;
      playerEl.controls = true;
      const container = createDiv({ cls: "local-media" });
      setPlyr(container, playerEl, getSetupTool(this.hash));
      this.replaceWith(container);
      return null;
    } else return this;
  }

  doVideoHost(thumbnail: boolean): this | null {
    const url = getUrl(this.linktext);
    if (!url) return this;

    const newEl = getPlayer(url, thumbnail);
    if (newEl) {
      this.replaceWith(newEl);
      return null;
    } else return this;
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

// <span alt="a.mp4 > 1" src="a.mp4#1" class="internal-embed ..." >
//   <video controls="" src="" ></video >
// </span>
export class InternalEmbedHandler extends Handler<HTMLSpanElement> {
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
