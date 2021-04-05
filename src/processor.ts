import MediaExtended from "main";
import { FileView, MarkdownPostProcessorContext, WorkspaceLeaf } from "obsidian";
import { parseUrl, parse, ParsedQuery } from "query-string";
// import Plyr from "plyr"

const parseOpt = {parseFragmentIdentifier: true};

/**
 * See also: https://www.w3.org/TR/media-frags/#valid-uri
 */
const tFragRegex = /(?<start>[\w:\.]*?)(?:,(?<end>[\w:\.]+?))?$/;

/**
 * HTMLMediaElement with temporal fragments
 */
interface HME_TF extends HTMLMediaElement{
  start:number;
  end:number;
}

function onplaying(this: any, event: Event) {
  const player = this as HME_TF;
  const { start,end, currentTime } = player;
  // check if is HME_TF object
  if (start||end){
    if (currentTime>end||currentTime<start){
      player.currentTime=start;
    }
  }
}

function ontimeupdate(this: any, event: Event) {
  const player = this as HME_TF;
  const { start,end, currentTime } = player;
  // check if is HME_TF object
  if ((start || end) && currentTime > end) {
    if (!player.loop){
      player.pause();
    } else {
      player.currentTime = start;
    }  
  }
}

function parseHash(url: string): ParsedQuery|null{
  const hash = parseUrl(url,parseOpt).fragmentIdentifier
  if(hash){
    return parse(hash);
  } else {
    return null;
  }
}

function parseTF(hash: string|undefined):TimeSpan|null{

  if (hash) {
    const params = parse(hash)
    const paramT = params.t
    if (paramT && typeof paramT === "string" && tFragRegex.test(paramT)){
      const {start,end} = paramT.match(tFragRegex)?.groups as {start:string;end:string}
      const timeSpan = getTimeSpan(start,end);
      return {...timeSpan, raw:paramT};
    }
  }

  return null;
}

interface TimeSpan {
  end: number;
  start: number;
  /**
   * raw value of key "t" in #t={value}
   */
  raw: string;
}

function getTimeSpan(
  start: string | undefined,
  end: string | undefined
): Omit<TimeSpan,"raw"> {
  // start may be an empty string
  const startRaw = start ? start : null;
  const endRaw = end ?? null;

  let startTime, endTime;
  if (startRaw && endRaw) {
    startTime = convertTime(startRaw);
    endTime = convertTime(endRaw);
  } else if (startRaw) {
    startTime = convertTime(startRaw);
    endTime = Infinity;
  } else if (endRaw) {
    startTime = 0;
    endTime = convertTime(endRaw);
  } else {
    throw new Error("Missing startTime and endTime");
  }

  return { start: startTime, end: endTime };
}

function convertTime(input: string) {
  return +input;
}

export function processInternalEmbeds(this: MediaExtended, el:HTMLElement, ctx:MarkdownPostProcessorContext) {

  const plugin = this;

  const obsConfig = { attributes: false, childList: true, subtree: false };

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
          observer.disconnect();
        }
      }
    }
  );

  function handleMedia(m:MutationRecord){
    const url = (m.target as HTMLSpanElement).getAttr("src");
    if (!url){
      console.error(m.target)
      throw new TypeError("src not found on container <span>")
    }
    const hash = parseUrl(url,parseOpt).fragmentIdentifier
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
    player.onplaying = onplaying;
    player.ontimeupdate = ontimeupdate;
  }

  function handleLink() {
    for (const e of el.querySelectorAll("a.internal-link")) {
      const oldLink = e as HTMLLinkElement;
      if (oldLink.href) {
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
                  console.log(filePath+";"+pathname);
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
              console.log(file);
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
    }
  }

  for (const span of el.querySelectorAll("span.internal-embed")) {
    internalEmbedObs.observe(span, obsConfig);
  }

  handleLink();

};



function bindTimeSpan(timeSpan: TimeSpan, player: HTMLMediaElement) {
  if (timeSpan.end !== Infinity) {
    player.ontimeupdate = function (e) {
      const p = this as HTMLMediaElement;
      if (p.currentTime >= timeSpan.end) {
        p.pause();
        p.ontimeupdate = null;
      }
    };
  }
  player.currentTime = timeSpan.start;
  if (player.paused)
    player.play();
}

export function processExternalEmbeds(el:HTMLElement, ctx:MarkdownPostProcessorContext) {
  console.log(el.innerHTML);
  for (const e of el.querySelectorAll("img[referrerpolicy]")) {
    console.log(e.outerHTML);
    const srcEl = e as HTMLImageElement;
    const ext = new URL(srcEl.src).pathname.split(".").last();

    let newEl: HTMLMediaElement;
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
    console.log(ext);
    if (type) {
      console.log('hello');
      newEl = createEl(type);
      newEl.src = srcEl.src;
      newEl.controls = true;
      srcEl.parentNode?.replaceChild(newEl, srcEl);
    }
  }
}