import MediaExtended from "main";
import { parse, stringify } from "query-string";
import {
  FileView,
  MarkdownPostProcessorContext,
  parseLinktext,
} from "obsidian";
import { parseTF, bindTimeSpan } from "./modules/MFParse";
import { injectTimestamp, getEmbedFrom } from "./modules/embed-process";

/**
 * HTMLMediaElement with temporal fragments
 */

export function processInternalLinks(
  this: MediaExtended,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  const plugin = this;
  const internalLinkObs = new MutationObserver((mutationsList, observer) => {
    for (const m of mutationsList) {
      handleLink(m.target as HTMLLinkElement);
      observer.disconnect();
    }
  });

  for (const link of el.querySelectorAll("a.internal-link")) {
    internalLinkObs.observe(link, { attributeFilter: ["class"] });
  }

  /**
   * Update internal links to media file to respond to temporal fragments
   */
  function handleLink(oldLink: HTMLLinkElement) {
    if (oldLink.hasClass("is-unresolved")) return;
    let srcLinktext = oldLink.dataset.href;
    if (!srcLinktext) {
      console.error(oldLink);
      throw new Error("no href found in a.internal-link");
    }

    const { path: linktext, subpath: hash } = parseLinktext(srcLinktext);
    const timeSpan = parseTF(hash);

    if (timeSpan) {
      const newLink = createEl("a", {
        cls: "internal-link",
        text: oldLink.innerText,
      });
      newLink.onclick = (e) => {
        const workspace = plugin.app.workspace;

        let openedMedia: HTMLElement[] = [];

        const matchedFile = plugin.app.metadataCache.getFirstLinkpathDest(
          linktext,
          ctx.sourcePath
        );
        if (!matchedFile) return;

        workspace.iterateAllLeaves((leaf) => {
          if (leaf.view instanceof FileView && leaf.view.file === matchedFile)
            openedMedia.push(leaf.view.contentEl);
        });

        function getPlayer(e: HTMLElement): HTMLMediaElement | null {
          return e.querySelector(
            "div.video-container > video, div.video-container > audio"
          );
        }

        if (openedMedia.length)
          openedMedia.forEach((e) => {
            bindTimeSpan(timeSpan, getPlayer(e));
          });
        else {
          const file = plugin.app.metadataCache.getFirstLinkpathDest(
            linktext,
            ctx.sourcePath
          );
          if (!file) return;

          const fileLeaf = workspace.createLeafBySplit(workspace.activeLeaf);
          fileLeaf.openFile(file).then(() => {
            if (fileLeaf.view instanceof FileView)
              bindTimeSpan(timeSpan, getPlayer(fileLeaf.view.contentEl));
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
  }
}

// Process internal embeds with hash
export function processInternalEmbeds(
  /* this: MediaExtended,  */ el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  // const plugin = this;

  const internalEmbedObs = new MutationObserver(
    (mutationsList: MutationRecord[]) =>
      mutationsList.forEach((m) => {
        if (m.addedNodes.length)
          switch (m.addedNodes[0].nodeName) {
            case "VIDEO":
            case "AUDIO":
              handleMedia(m);
              break;
            case "IMG":
              // Do nothing
              break;
            default:
              throw new TypeError(
                `Unexpected addnote type: ${m.addedNodes[0].nodeName}`
              );
          }
      })
  );

  for (const span of el.querySelectorAll("span.internal-embed")) {
    internalEmbedObs.observe(span, { childList: true });
    setTimeout(() => {
      internalEmbedObs.disconnect();
      console.log("internalEmbedObs disconnected");
    }, 1500);
  }

  /**
   * Update media embeds to respond to temporal fragments
   */
  function handleMedia(m: MutationRecord) {
    /** src="linktext" */
    const span = m.target as HTMLSpanElement;
    const srcLinktext = span.getAttr("src");
    if (srcLinktext === null) {
      console.error(span);
      throw new TypeError("src not found on container <span>");
    }

    const { subpath: hash } = parseLinktext(srcLinktext);
    const timeSpan = parseTF(hash);

    const player = m.addedNodes[0] as HTMLMediaElement;
    if (timeSpan !== null) {
      // import timestamps to player
      injectTimestamp(player, timeSpan);
    }
    // null: exist, with no value (#loop)
    if (parse(hash).loop === null) {
      player.loop = true;
    }

  }
}

export function processExternalEmbeds(
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  for (const e of el.querySelectorAll("img[referrerpolicy]")) {

    const replaceWith = (newEl:HTMLElement) =>{
      if (srcEl.parentNode){
        srcEl.parentNode.replaceChild(newEl, srcEl);
      } else {
        console.error(srcEl);
        throw new Error("parentNode of image not found");
      }
    }

    const srcEl = e as HTMLImageElement;

    let url: URL;
    try {
      url = new URL(srcEl.src);
    } catch (error) {
      // if url is invaild, do nothing and break current loop
      console.error(error, srcEl);
      break;
    }

    // if url contains no extension, type = null
    let type: "audio" | "video" | null = null;
    if (!url.pathname.includes(".")) {
      const ext = url.pathname.split(".").pop() as string;
      switch (ext) {
        case "mp3": case "wav": case "m4a": 
        case "ogg": case "3gp": case "flac":
          type = "audio";
          break;
        case "mp4": case "webm": case "ogv":
          type = "video";
          break;
      }
    } 

    let newEl: HTMLMediaElement | HTMLDivElement | null = null;

    if (type) {
      newEl = createEl(type);
      newEl.src = srcEl.src;
      newEl.controls = true;
      replaceWith(newEl);
    } else if (newEl = getEmbedFrom(url)){
      replaceWith(newEl);
    }
  }
}


