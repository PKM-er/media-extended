import {
  MarkdownPostProcessor,
  MarkdownPostProcessorContext,
  Plugin,
} from "obsidian";
// import Plyr from "plyr"

export default class MediaExtended extends Plugin {

  // player = Plyr;

  async onload(): Promise<void> {
    console.log("loading media-extended");

    this.registerMarkdownPostProcessor(processInternalEmbeds);
    this.registerMarkdownPostProcessor(processExternalEmbeds);

    // this.registerMarkdownPostProcessor(processVideoPlayer.bind(this));
  }

  onunload() {
    console.log("unloading media-extended");
  }
}

// function processVideoPlayer(el:HTMLElement, ctx:MarkdownPostProcessorContext) {
//    this.player = new Plyr("span.internal-embed > video")
// }

const processExternalEmbeds: MarkdownPostProcessor = (el, ctx) => {
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
      newEl.src=srcEl.src
      newEl.controls=true;
      srcEl.parentNode.replaceChild(newEl, srcEl);
    }
  }
};

const processInternalEmbeds: MarkdownPostProcessor = (el, ctx) => {

  const internalEmbedObs = new MutationObserver(
  // Update embed's src to include temporal fragment when it is loaded
  (mutationsList, observer) => {
    // See also: https://www.w3.org/TR/media-frags/#valid-uri
    const tFragRegex = /(?<=#)t=([\w:\.]*?)(?:,([\w:\.]+?))?$/;
    for (const m of mutationsList) {
      if (m.addedNodes.length) {
        switch (m.addedNodes[0].nodeName) {
          case "VIDEO":
          case "AUDIO":
            const matchArray = (m.target as HTMLSpanElement)
              .getAttr("src")
              .match(tFragRegex);
            if (matchArray) {
              const embed = m.addedNodes[0] as HTMLMediaElement;
              const tFrag = matchArray[0];
              const url = new URL(embed.src);
              url.hash = tFrag;
              embed.src = url.toString();
            }
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
