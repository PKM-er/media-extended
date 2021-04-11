import MediaExtended from "main";
import { parse, stringify } from "query-string";
import { FileView, MarkdownPostProcessorContext, parseLinktext } from "obsidian";
import { parseTF, bindTimeSpan } from "./MFParse";
// import Plyr from "plyr"

/**
 * HTMLMediaElement with temporal fragments
 */
interface HME_TF extends HTMLMediaElement {
  start: number;
  end: number;
}

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
    let srcLinktext = oldLink.dataset.href
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

        workspace.iterateAllLeaves((l) => {
          const viewState = l.getViewState();
          switch (viewState.type) {
            case "video":
            case "audio":
              const filePath = viewState.state.file;
              if (filePath && (filePath as string)?.contains(linktext)) {
                openedMedia.push((l.view as FileView).contentEl);
              }
              break;
          }
        });

        if (openedMedia.length) {
          for (const e of openedMedia) {
            const player = e.querySelector(
              "div.video-container > video, div.video-container > audio"
            ) as HTMLMediaElement;
            bindTimeSpan(timeSpan, player);
          }
        } else {
          let file = plugin.app.metadataCache.getFirstLinkpathDest(
            linktext,
            ctx.sourcePath
          );
          let fileLeaf = workspace.createLeafBySplit(workspace.activeLeaf);
          fileLeaf.openFile(file).then(() => {
            const player = (fileLeaf.view as FileView).contentEl.querySelector(
              "div.video-container > video, div.video-container > audio"
            ) as HTMLMediaElement;
            bindTimeSpan(timeSpan, player);
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
    const span = m.target as HTMLSpanElement
    const srcLinktext  = span.getAttr("src")
    if (srcLinktext === null) {
      console.error(span);
      throw new TypeError("src not found on container <span>");
    }
    
    const { subpath: hash } = parseLinktext(srcLinktext);
    const timeSpan = parseTF(hash);

    const player = m.addedNodes[0] as HME_TF;
    if (timeSpan !== null) {
      // import timestamps to player
      player.start = timeSpan.start;
      player.end = timeSpan.end;
      // inject media fragment into player's src
      const { path, subpath: hash } = parseLinktext(player.src);
      let hashObj = parse(hash);
      hashObj.t = timeSpan.raw;
      player.src = path + "#" + stringify(hashObj);
    }
    if (parse(hash).loop === null) {
      player.loop = true;
    }
    player.onplaying = (e) => {
      const player = e.target as HME_TF;
      const { start, end, currentTime } = player;
      // check if is HME_TF object
      if (start || end) {
        if (currentTime > end || currentTime < start) {
          player.currentTime = start;
        }
      }
    };
    player.ontimeupdate = (e) => {
      const player = e.target as HME_TF;
      const { start, end, currentTime } = player;
      // check if is HME_TF object
      if ((start || end) && currentTime > end) {
        if (!player.loop) {
          player.pause();
        } else {
          player.currentTime = start;
        }
      }
    };
  }
}

export function processExternalEmbeds(
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  for (const e of el.querySelectorAll("img[referrerpolicy]")) {
    const srcEl = e as HTMLImageElement;
    const ext = new URL(srcEl.src).pathname.split(".").last();

    let newEl: HTMLMediaElement;
    let type: "audio" | "video" | null;
    switch (ext) {
      case "mp3": case "wav": case "m4a": 
      case "ogg": case "3gp": case "flac":
        type = "audio";
        break;
      case "mp4": case "webm": case "ogv":
        type = "video";
        break;
      default:
        type = null;
    }
    if (type) {
      newEl = createEl(type);
      newEl.src = srcEl.src;
      newEl.controls = true;
      srcEl.parentNode?.replaceChild(newEl, srcEl);
    }
  }
}
