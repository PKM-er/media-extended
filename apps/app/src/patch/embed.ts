import type { EmbedCreator, Plugin } from "obsidian";
import { encodeWebpageUrl } from "@/lib/remote-player/encode";
import type { Size } from "@/lib/size-syntax";
import { parseSizeFromLinkTitle } from "@/lib/size-syntax";
import type { UrlMediaInfo } from "@/media-note/note-index/url-info";
import { parseUrl } from "@/media-note/note-index/url-info";
import { titleFromUrl } from "@/media-view/base";
import { MediaRenderChild } from "@/media-view/url-embed";
import type MxPlugin from "@/mx-main";
import setupEmbedWidget from "./embed-widget";
import { MediaFileExtensions } from "./media-type";
import { reloadMarkdownPreview } from "./utils";

export default function injectMediaEmbed(
  this: MxPlugin,
  embedCreator: EmbedCreator,
) {
  injectFileMediaEmbed.call(this, embedCreator);
  injectUrlMediaEmbed.call(this);
  setupEmbedWidget(this);
}

function injectFileMediaEmbed(this: Plugin, embedCreator: EmbedCreator) {
  const { app } = this;
  (["video", "audio"] as const).forEach((type) => {
    const exts = MediaFileExtensions[type];
    const revertBackup = unregisterExistingEmbed(exts),
      unregister = registerEmbed(exts, embedCreator);
    this.register(() => {
      unregister();
      revertBackup();
    });
  });
  // reload to apply embed changes
  reloadMarkdownPreview(app.workspace);
  this.register(() => {
    // reload to revert embed changes
    reloadMarkdownPreview(app.workspace);
  });

  function registerEmbed(exts: string[], newCreator: EmbedCreator) {
    app.embedRegistry.registerExtensions(exts, newCreator);
    return () => {
      app.embedRegistry.unregisterExtensions(exts);
    };
  }
  function unregisterExistingEmbed(exts: string[]) {
    const creatorBackup: (EmbedCreator | undefined)[] = exts.map(
      (ext) => app.embedRegistry.embedByExtension[ext],
    );
    app.embedRegistry.unregisterExtensions(exts);
    return () => {
      exts.forEach((ext, i) => {
        const creator = creatorBackup[i];
        creator && app.embedRegistry.registerExtension(ext, creator);
      });
    };
  }
}

class UrlEmbedMarkdownRenderChild extends MediaRenderChild {
  constructor(
    public info: UrlMediaInfo,
    public containerEl: HTMLElement,
    public plugin: MxPlugin,
  ) {
    super(containerEl, plugin);
    containerEl.addClasses(["mx-external-media-embed"]);
    this.update({
      hash: info.hash,
      source: {
        src:
          info.viewType === "mx-webpage"
            ? encodeWebpageUrl(info.source.href)
            : info.source.href,
        original: info.original,
        viewType: info.viewType,
      },
      title: titleFromUrl(info.source.href),
    });
  }
}

function injectUrlMediaEmbed(this: MxPlugin) {
  this.registerMarkdownPostProcessor((el, ctx) => {
    for (const img of el.querySelectorAll("img")) {
      const info = extractSourceFromImg(img);
      if (!info) continue;
      replace(this, info, img);
    }
    for (const iframe of el.querySelectorAll<HTMLIFrameElement>(
      'iframe[src*="youtube.com/embed/"]',
    )) {
      const sourceText = ctx.getSectionInfo(iframe)?.text;
      const info =
        extractSourceFromMarkdown(sourceText) ??
        extractSourceFromIframe(iframe);
      if (!info) continue;
      replace(this, info, iframe);
    }

    function replace(plguin: MxPlugin, info: EmbedSource, target: HTMLElement) {
      const { title, original } = info;
      const newWarpper = createSpan({
        cls: ["media-embed", "external-embed", "is-loaded"],
        attr: {
          src: original,
          alt: title,
        },
      });
      target.replaceWith(newWarpper);
      ctx.addChild(new UrlEmbedMarkdownRenderChild(info, newWarpper, plguin));
    }
  });
}

interface EmbedSource extends UrlMediaInfo {
  title: string;
  size: Size | null;
}

function extractSourceFromImg(img: HTMLImageElement): EmbedSource | null {
  const linkTitle = img.alt,
    srcText = img.src;

  const src = parseUrl(srcText);
  if (!src) return null;

  const [title, size] = parseSizeFromLinkTitle(linkTitle);
  return { ...src, title, size };
}

function extractSourceFromMarkdown(
  md: string | null | undefined,
): EmbedSource | null {
  if (!md) return null;
  const match = md.match(/!\[(?<alt>[^\]]*)\]\((?<src>[^)]+)\)/);
  if (!match) return null;
  const { alt: linkTitle, src: srcText } = match.groups!;
  const src = parseUrl(srcText);
  if (!src) return null;
  const [title, size] = parseSizeFromLinkTitle(linkTitle);
  return { ...src, title, size };
}

function extractSourceFromIframe(
  iframe: HTMLIFrameElement,
): EmbedSource | null {
  console.warn("cannot get source text of iframe, use src instead");
  const srcText = iframe.src;
  const src = parseUrl(srcText);
  if (!src) return null;
  return { ...src, title: titleFromUrl(srcText), size: null };
}
