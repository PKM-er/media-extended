import { MarkdownPostProcessor, MarkdownPostProcessorContext } from "obsidian";

const tFragRegex = /(?<start>[\w:\.]*?)(?:,(?<end>[\w:\.]+?))?$/;

/**
 * HTMLMediaElement with temporal fragments
 */
interface HME_TF extends HTMLMediaElement{
  startTime:number;
  endTime:number;
}

function onplaying(event: Event) {
  const player = event.target as HME_TF;
  const { startTime,endTime, currentTime } = player;
  // check if is HME_TF object
  if (startTime||endTime){
    if (currentTime>endTime||currentTime<startTime){
      player.currentTime=startTime;
    }
  }
}

function ontimeupdate(event: Event) {
  const player = event.target as HME_TF;
  const { startTime,endTime, currentTime } = player;
  // check if is HME_TF object
  if ((startTime || endTime) && currentTime > endTime) {
    if (!player.loop){
      player.pause();
    } else {
      player.currentTime = startTime;
    }
    
  }
}



function getTimeSpan(start:string|undefined,end:string|undefined){
  // start may be an empty string
  const startRaw = start ? start : null;
  const endRaw = end ?? null;

  let startTime, endTime
  if (startRaw && endRaw){
    startTime=convertTime(startRaw);
    endTime=convertTime(endRaw);
  }
  else if (startRaw){
    startTime=convertTime(startRaw);
    endTime=Infinity;
  }
  else if (endRaw){
    startTime=0;
    endTime=convertTime(endRaw);
  } else {throw new Error("Missing startTime and endTime");}

  return {startTime,endTime};
}

function convertTime(input: string) {
  return +input;
}

export function processInternalEmbeds(el:HTMLElement, ctx:MarkdownPostProcessorContext) {

  const internalEmbedObs = new MutationObserver(
    // Update embed's src to include temporal fragment when it is loaded
    (mutationsList, observer) => {
      // See also: https://www.w3.org/TR/media-frags/#valid-uri
      for (const m of mutationsList) {
        if (m.addedNodes.length) {
          switch (m.addedNodes[0].nodeName) {
            case "VIDEO":
            case "AUDIO":
              const url = (m.target as HTMLSpanElement).getAttr("src")
              const hash = url.split('#').last();
              const params = new URLSearchParams(hash);
              const paramT = params.get('t')
              const player = m.addedNodes[0] as HME_TF;
              if (paramT!==null) {
                let rawTime = paramT.match(tFragRegex).groups
                const timeSpan = getTimeSpan(
                  rawTime.start,
                  rawTime.end
                );
                // import timestamps to player
                Object.assign(player,timeSpan);
                const tFrag = `t=${paramT}`;
                const url = new URL(player.src);
                url.hash = tFrag;
                player.src = url.toString();
              }
              if (params.get('loop')===""){
                player.loop=true;
              }
              player.onplaying = onplaying;
              player.ontimeupdate = ontimeupdate;
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
    });

  const obsConfig = { attributes: false, childList: true, subtree: false };

  for (const span of el.querySelectorAll("span.internal-embed")) {
    internalEmbedObs.observe(span, obsConfig);
  }
};

export function processExternalEmbeds(el:HTMLElement, ctx:MarkdownPostProcessorContext) {
  console.log(el.innerHTML);
  for (const e of el.querySelectorAll("img[referrerpolicy]")) {
    console.log(e.outerHTML);
    const srcEl = e as HTMLImageElement;
    const ext = new URL(srcEl.src).pathname.split(".").last();

    let newEl: HTMLMediaElement;
    let type: "audio" | "video";
    switch (ext) {
      case "mp3": case "wav": case "m4a": case "ogg": case "3gp": case "flac":
        type = "audio";
        break;
      case "mp4": case "webm": case "ogv":
        type = "video";
        break;
    }
    console.log(ext);
    if (type) {
      console.log('hello');
      newEl = createEl(type);
      newEl.src = srcEl.src;
      newEl.controls = true;
      srcEl.parentNode.replaceChild(newEl, srcEl);
    }
  }
}