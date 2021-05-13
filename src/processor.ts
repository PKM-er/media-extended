import MediaExtended from "main";
import { parse } from "query-string";
import {
  FileView,
  MarkdownPostProcessorContext,
  parseLinktext,
} from "obsidian";
import { parseTF } from "./modules/tfTools";
import { injectTimestamp } from "./modules/playerSetup";
import { ExternalEmbedHandler } from "modules/handlers";

type mutationParam = {
  callback: MutationCallback;
  option: MutationObserverInit;
};

/**
 * @param src raw linktext (may contain #hash)
 * @returns setPlayer return null when timeSpan not parsed from srcLinktext
 */
function playerSetupTool(src: string): {
  linktext: string;
  setPlayer: ((player: HTMLMediaElement) => void) | null;
} {
  if (!src) throw new TypeError("srcLinktext empty");
  const { path: linktext, subpath: hash } = parseLinktext(src);
  const timeSpan = parseTF(hash);

  let setPlayer: ((player: HTMLMediaElement) => void) | null;
  if (!timeSpan) setPlayer = null;
  else
    setPlayer = (player: HTMLMediaElement): void => {
      // null: exist, with no value (#loop)
      if (parse(hash).loop === null) player.loop = true;
      // import timestamps to player
      injectTimestamp(player, timeSpan);
    };

  return { linktext, setPlayer };
}

/** Process internal link to media files with hash */
export function processInternalLinks(
  this: MediaExtended,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  const plugin = this;

  const internalLink: mutationParam = {
    // check if link is resolved
    callback: (list, obs) => {
      for (const m of list) {
        const a = m.target as HTMLAnchorElement;
        if (!a.hasClass("is-unresolved"))
          handleLink(m.target as HTMLAnchorElement);
        obs.disconnect();
      }
    },
    option: { attributeFilter: ["class"], attributeOldValue: true },
  };

  for (const link of el.querySelectorAll("a.internal-link")) {
    const ilObs = new MutationObserver(internalLink.callback);
    ilObs.observe(link, internalLink.option);
  }

  /**
   * Update internal links to media file to respond to temporal fragments
   */
  function handleLink(oldLink: HTMLAnchorElement) {
    let srcLinktext = oldLink.dataset.href;
    if (!srcLinktext) {
      console.error(oldLink);
      throw new Error("no href found in a.internal-link");
    }

    const { linktext, setPlayer: basicSetup } = playerSetupTool(srcLinktext);

    // skip if timeSpan is missing or invalid
    if (!basicSetup) return;

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

      const setPlayer = (e: HTMLElement): void => {
        // prettier-ignore
        const player = e.querySelector(
          "div.video-container > video, " +
          "div.audio-container > audio, " +
          "div.video-container > audio" // for webm audio
        ) as HTMLMediaElement;
        if (!player) throw new Error("no player found in FileView");
        basicSetup(player);
        player.play();
      };

      if (openedMedia.length) openedMedia.forEach((e) => setPlayer(e));
      else {
        const fileLeaf = workspace.createLeafBySplit(workspace.activeLeaf);
        fileLeaf.openFile(matchedFile).then(() => {
          if (fileLeaf.view instanceof FileView)
            setPlayer(fileLeaf.view.contentEl);
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

/** Process internal media embeds with hash */
export function processInternalEmbeds(el: HTMLElement) {
  let allEmbeds;
  if ((allEmbeds = el.querySelectorAll("span.internal-embed"))) {
    const internalEmbed: mutationParam = {
      callback: (list, obs) => {
        for (const mutation of list) {
          const span = mutation.target as HTMLSpanElement;
          if (span.hasClass("is-loaded") && !span.hasClass("mod-empty")) {
            if (span.hasClass("media-embed")) handleMedia(span);
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
  /**
   * Update media embeds to respond to temporal fragments
   */
  function handleMedia(span: HTMLSpanElement) {
    const srcLinktext = span.getAttr("src");
    if (srcLinktext === null) {
      console.error(span);
      throw new TypeError("src not found on container <span>");
    }

    const { setPlayer } = playerSetupTool(srcLinktext);

    // skip if timeSpan is missing or invalid
    if (!setPlayer) return;

    const webmEmbed: mutationParam = {
      option: {
        childList: true,
      },
      callback: (list, obs) =>
        list.forEach((m) =>
          m.addedNodes.forEach((node) => {
            if (node instanceof HTMLMediaElement) {
              setPlayer(node);
              obs.disconnect();
            }
          }),
        ),
    };

    if (!(span.firstElementChild instanceof HTMLMediaElement)) {
      console.error("first element not player: %o", span.firstElementChild);
      return;
    }

    setPlayer(span.firstElementChild);
    if (span.getAttr("src")?.match(/\.webm$|\.webm#/)) {
      const webmObs = new MutationObserver(webmEmbed.callback);
      webmObs.observe(span, webmEmbed.option);
    }
  }
}

export function processExternalEmbeds(docEl: HTMLElement) {
  const handler = new ExternalEmbedHandler();
  for (const el of docEl.querySelectorAll("img[referrerpolicy]")) {
    // <img src="" referrerpolicy="no-referrer">
    const img = el as HTMLImageElement;
    handler.setTarget(img).doDirectLink()?.doVideoHost();
  }
}
