import MediaExtended from "main";
import { FileView, MarkdownPostProcessorContext, WorkspaceLeaf } from "obsidian";
import { parseUrl } from "query-string";
import { parseTF, bindTimeSpan, parseHash } from "./MFParse";
// import Plyr from "plyr"

/**
 * HTMLMediaElement with temporal fragments
 */
interface HME_TF extends HTMLMediaElement{
  start:number;
  end:number;
}

export function processInternalLinks(this: MediaExtended, el:HTMLElement, ctx:MarkdownPostProcessorContext) {

  const plugin = this;

  // process internal links with hash

  const internalLinkObs = new MutationObserver(
    (mutationsList, observer) => {
      for (const m of mutationsList) {
        const oldLink = m.target as HTMLLinkElement;
        if (!oldLink.hasClass("is-unresolved") && oldLink.href) {
          const urlParsed = new URL(oldLink.href)
          const timeSpan = parseTF(urlParsed.hash);
          // remove leading '/'
          const pathname = urlParsed.pathname.substring(1);
    
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
                    const filePath = viewState.state.file 
                    if (filePath && (filePath as string)?.contains(pathname)) {
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
                let file = plugin.app.metadataCache.getFirstLinkpathDest(pathname,ctx.sourcePath);
                let fileLeaf = workspace.createLeafBySplit(workspace.activeLeaf);
                fileLeaf.openFile(file).then(()=>{
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
          //
        }
        observer.disconnect();
      }
    }
  )
  for (const link of el.querySelectorAll("a.internal-link")) {
    internalLinkObs.observe(link, { attributeFilter: ["class"] });
  }
}

export function processInternalEmbeds(/* this: MediaExtended,  */el:HTMLElement, ctx:MarkdownPostProcessorContext) {

  // const plugin = this;

  // Process internal embeds with hash

  const internalEmbedObs = new MutationObserver(
    // Update embed's src to include temporal fragment when it is loaded
    (mutationsList, observer) => {
      for (const m of mutationsList) {
        if (m.addedNodes.length) {
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
        }
      }
    }
  );

  for (const span of el.querySelectorAll("span.internal-embed")) {
    internalEmbedObs.observe(span, { childList: true });
    setTimeout( ()=>{
      internalEmbedObs.disconnect();
      console.log('internalEmbedObs disconnected');
    } , 1500);
  }

  function handleMedia(m:MutationRecord){
    const url = (m.target as HTMLSpanElement).getAttr("src");
    if (!url){
      console.error(m.target)
      throw new TypeError("src not found on container <span>")
    }
    const hash = parseUrl(url,{parseFragmentIdentifier: true}).fragmentIdentifier
    const timeSpan = parseTF(hash);
    const player = m.addedNodes[0] as HME_TF;
    if (timeSpan!==null) {
      // import timestamps to player
      player.start=timeSpan.start;
      player.end=timeSpan.end;
      // inject media fragment into player's src
      const url = new URL(player.src);
      url.hash = `t=${timeSpan.raw}`;
      player.src = url.toString();
    }
    if (parseHash(url)?.loop===null){
      player.loop=true;
    }
    player.onplaying = e => {
      const player = e.target as HME_TF;
      const { start,end, currentTime } = player;
      // check if is HME_TF object
      if (start||end){
        if (currentTime>end||currentTime<start){
          player.currentTime=start;
        }
      }
    };
    player.ontimeupdate = e => {
      const player = e.target as HME_TF;
      const { start,end, currentTime } = player;
      // check if is HME_TF object
      if ((start || end) && currentTime > end) {
        if (!player.loop){
          player.pause();
        } else {
          player.currentTime = start;
        }  
      }
    };
  }
};

export function processExternalEmbeds(el:HTMLElement, ctx:MarkdownPostProcessorContext) {
  for (const e of el.querySelectorAll("img[referrerpolicy]")) {
    const srcEl = e as HTMLImageElement;
    const ext = new URL(srcEl.src).pathname.split(".").last();
    const replaceWith = (newEl:HTMLElement) =>{
      if (srcEl.parentNode){
        srcEl.parentNode.replaceChild(newEl, srcEl);
      } else {
        console.error(srcEl);
        throw new Error("parentNode of image not found");
      }
    }

    let newEl: HTMLMediaElement|HTMLIFrameElement|null = null;
    let type: "audio" | "video" | null;
    switch (ext) {
      case "mp3": case "wav": case "m4a": case "ogg": case "3gp": case "flac":
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
      replaceWith(newEl);
    } else if (newEl = getEmbedFrom(srcEl.src)){
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
        return `https://player.bilibili.com/player.html${queryStr}`;
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

function getEmbedFrom(url:string): HTMLIFrameElement | null {
  let embedUrl = convertToEmbedUrl(new URL(url));

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