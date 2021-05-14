import MediaExtended from "main";
import { FileView, MarkdownPostProcessorContext } from "obsidian";
import Plyr from "plyr";
import { Await, filterDuplicates, mutationParam } from "./misc";
import { getSetupTool } from "./playerSetup";
import { getSubtitleTracks, SubtitleResource } from "./subtitle";
import { getPlayer } from "./videohost/getPlayer";

type mediaType = "audio" | "video";
const acceptedExt: Map<mediaType, string[]> = new Map([
  ["audio", ["mp3", "wav", "m4a", "ogg", "3gp", "flac"]],
  ["video", ["mp4", "webm", "ogv"]],
]);
export class ExternalEmbedHandler {
  target: HTMLImageElement;
  constructor(target?: HTMLImageElement) {
    if (target) this.target = target;
    else this.target = createEl("img");
  }

  setTarget(target: HTMLImageElement): this {
    this.target = target;
    return this;
  }

  public get src(): string {
    return this.target.src;
  }

  public get srcUrl(): URL | null {
    try {
      return new URL(this.src);
    } catch (error) {
      // if url is invaild, do nothing and break current loop
      return null;
    }
  }

  private replaceWith(newEl: HTMLElement) {
    if (this.target.parentNode) {
      this.target.parentNode.replaceChild(newEl, this.target);
    } else {
      console.error(this.target);
      throw new Error("parentNode of img not found");
    }
  }

  doDirectLink(): this | null {
    const url = this.srcUrl;
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
      const { setPlayerTF } = getSetupTool(this.src);
      let newEl = createEl(fileType);
      newEl.src = this.src;
      newEl.controls = true;
      if (setPlayerTF) setPlayerTF(newEl);
      this.replaceWith(newEl);
      return null;
    } else return this;
  }

  doVideoHost(thumbnail: boolean): this | null {
    const url = this.srcUrl;
    if (!url) return this;

    const newEl = getPlayer(url, thumbnail);
    if (newEl) {
      this.replaceWith(newEl);
      return null;
    } else return this;
  }
}

/**
 * Update internal links to media file to respond to temporal fragments
 */
export function handleLink(
  oldLink: HTMLAnchorElement,
  plugin: MediaExtended,
  ctx: MarkdownPostProcessorContext,
) {
  let srcLinktext = oldLink.dataset.href;
  if (!srcLinktext) {
    console.error(oldLink);
    throw new Error("no href found in a.internal-link");
  }

  const { linktext, setPlayerTF } = getSetupTool(srcLinktext);

  // skip if timeSpan is missing or invalid
  if (!setPlayerTF) return;

  const newLink = createEl("a", {
    cls: "internal-link",
    text: oldLink.innerText,
  });
  newLink.onclick = (e) => {
    const workspace = plugin.app.workspace;

    const openedMedia: HTMLElement[] = [];

    const matchedFile = plugin.app.metadataCache.getFirstLinkpathDest(
      linktext,
      ctx.sourcePath,
    );
    if (!matchedFile) return;

    workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof FileView && leaf.view.file === matchedFile)
        openedMedia.push(leaf.view.contentEl);
    });

    const setPlayerTF = (e: HTMLElement): void => {
      // prettier-ignore
      const player = e.querySelector(
          "div.video-container > video, " +
          "div.audio-container > audio, " +
          "div.video-container > audio" // for webm audio
        ) as HTMLMediaElement;
      if (!player) throw new Error("no player found in FileView");
      setPlayerTF(player);
      player.play();
    };

    if (openedMedia.length) openedMedia.forEach((e) => setPlayerTF(e));
    else {
      const fileLeaf = workspace.createLeafBySplit(workspace.activeLeaf);
      fileLeaf.openFile(matchedFile).then(() => {
        if (fileLeaf.view instanceof FileView)
          setPlayerTF(fileLeaf.view.contentEl);
      });
    }
  };
  if (oldLink.parentNode) {
    oldLink.parentNode.replaceChild(newLink, oldLink);
  } else {
    console.error(oldLink);
    throw new Error("parentNode not found");
  }
}

/**
 * Update media embeds to respond to temporal fragments
 */
export async function handleMedia(
  span: HTMLSpanElement,
  plugin: MediaExtended,
  ctx: MarkdownPostProcessorContext,
) {
  const srcLinktext = span.getAttr("src");
  if (srcLinktext === null) {
    console.error(span);
    throw new TypeError("src not found on container <span>");
  }

  const { setPlayerTF } = getSetupTool(srcLinktext);

  if (!(span.firstElementChild instanceof HTMLMediaElement)) {
    console.error("first element not player: %o", span.firstElementChild);
    return;
  }

  const isWebm = /\.webm$|\.webm#/.test(span.getAttr("src") ?? "");

  function setupPlayer(
    mediaEl: HTMLMediaElement,
    info: Await<ReturnType<typeof getSubtitleTracks>>,
    isWebm = false,
  ): HTMLDivElement {
    if (!mediaEl.parentElement) throw new Error("no parentElement");
    const container = createDiv({ cls: "local-media" });
    mediaEl.parentElement.appendChild(container);

    let target: HTMLMediaElement;
    if (!isWebm) target = mediaEl;
    else {
      target = mediaEl.cloneNode(true) as typeof mediaEl;
      mediaEl.addClass("visuallyhidden");
    }
    container.appendChild(target);
    ctx.addChild(new SubtitleResource(container, info?.objUrls ?? []));

    if (info) info.tracks.forEach((t) => target.appendChild(t));
    const player = new Plyr(target);
    if (setPlayerTF) setPlayerTF(player);
    return container;
  }

  const videoFile = plugin.app.metadataCache.getFirstLinkpathDest(
    span.getAttr("src") as string,
    ctx.sourcePath,
  );
  const tracks = await getSubtitleTracks(videoFile, plugin);

  const srcMediaEl = span.firstElementChild;
  /**
   * div.local-media warped srcMediaEl by default
   * div.local-media containing cloned srcMediaEl when file is webm
   */
  const newMediaContainer = setupPlayer(srcMediaEl, tracks, isWebm);

  const webmEmbed: mutationParam = {
    callback: (list, obs) => {
      list.forEach((m) => {
        if (m.addedNodes.length)
          newMediaContainer.parentElement?.removeChild(newMediaContainer);
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLMediaElement) {
            setupPlayer(node, tracks);
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
    webmObs.observe(span, webmEmbed.option);
    setTimeout(() => {
      if (srcMediaEl.parentElement)
        srcMediaEl.parentElement.removeChild(srcMediaEl);
    }, 800);
  }
}
