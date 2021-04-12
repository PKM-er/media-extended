import MediaExtended from "main";
import { parse, stringify } from "query-string";
import {
  FileView,
  MarkdownPostProcessorContext,
  parseLinktext,
} from "obsidian";
import { parseTF, bindTimeSpan, HTMLMediaEl_TF, TimeSpan, isHTMLMediaEl_TF } from "./MFParse";
// import Plyr from "plyr"

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

    const player = m.addedNodes[0] as HTMLMediaEl_TF;
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

function injectTimestamp(player: HTMLMediaElement, timeSpan: TimeSpan) {
  (player as HTMLMediaEl_TF).timeSpan = timeSpan;

  // inject media fragment into player's src
  const { path, subpath: hash } = parseLinktext(player.src);
  let hashObj = parse(hash);
  hashObj.t = timeSpan.raw;
  player.src = path + "#" + stringify(hashObj);

  // inject event handler to restrict play range
  player.onplaying = (e) => {
    const player = e.target as HTMLMediaElement;
    if (isHTMLMediaEl_TF(player)) {
      const {
        timeSpan: { start, end },
        currentTime,
      } = player;
      if (currentTime > end || currentTime < start) {
        player.currentTime = start;
      }
    } else {
      console.error(player);
      throw new Error("missing timeSpan in HTMLMediaEl_TF");     
    }
  };
  player.ontimeupdate = (e) => {
    const player = e.target as HTMLMediaElement;
    if (isHTMLMediaEl_TF(player)) {
      const {
        timeSpan: { start, end },
        currentTime,
      } = player;
      // check if is HTMLMediaEl_TF object
      if (currentTime > end) {
        if (!player.loop) {
          player.pause();
        } else {
          player.currentTime = start;
        }
      }
    } else {
      console.error(player);
      throw new Error("missing timeSpan in HTMLMediaEl_TF");     
    }
  };
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

    let newEl: HTMLMediaElement | HTMLIFrameElement | null = null;

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

function convertToEmbedUrl(src: URL): string | null {
  switch (src.hostname) {
    case "www.bilibili.com":
      if (src.pathname.startsWith("/video")) {
        let videoId = src.pathname.replace("/video/", "");
        let queryStr: string;
        if (/^bv/i.test(videoId)) {
          queryStr = `?bvid=${videoId}`;
        } else if (/^av/i.test(videoId)) {
          queryStr = `?aid=${videoId}`;
        } else {
          console.error(`invaild bilibili video-id: ${videoId}`);
          return null;
        }
        let page = src.searchParams.get("p");
        if (page)
          queryStr += `&page=${page}`
        return `https://player.bilibili.com/player.html${queryStr}&high_quality=1&danmaku=0`;
      } else {
        console.log("not recognized as bilibili video");
        return null;
      }
      break;
    case "www.youtube.com":
      if (src.pathname === "/watch") {
        let videoId = src.searchParams.get("v");
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        } else {
          console.log(`invalid video id from: ${src.toString()}`);
          return null;
        }
      } else {
        console.log("not recognized as youtube video");
        return null;
      }
      break;
    default:
      console.log("unsupported video host");
      return null;
  }
}

function getEmbedFrom(url:URL): HTMLIFrameElement | null {
  let embedUrl = convertToEmbedUrl(url);

  if (embedUrl){
    return createEl("iframe", {
      attr: {
        class: "external-video",
        src: embedUrl,
        scrolling: "no",
        border: "0",
        frameborder: "no",
        framespacing: "0",
        allowfullscreen: false,
        sandbox: "allow-forms allow-presentation allow-same-origin allow-scripts allow-modals"
      },
    });
  }
  else {
    return null
  }

}
