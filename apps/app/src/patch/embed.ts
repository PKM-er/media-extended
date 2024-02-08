import type { EmbedCreator, Plugin } from "obsidian";
import type { Size } from "@/lib/size-syntax";
import { parseSizeFromLinkTitle } from "@/lib/size-syntax";
import { titleFromUrl } from "@/media-view/base";
import { MediaRenderChild } from "@/media-view/url-embed";
import { MEDIA_WEBPAGE_VIEW_TYPE } from "@/media-view/view-type";
import type { RemoteMediaViewType } from "@/media-view/view-type";
import type MxPlugin from "@/mx-main";
import type { MediaURL } from "@/web/url-match";
import { getSupportedViewType } from "@/web/url-match/view-type";
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
    public info: MediaURL,
    public viewType: RemoteMediaViewType,
    public containerEl: HTMLElement,
    public plugin: MxPlugin,
  ) {
    super(containerEl, plugin);
    containerEl.addClasses(["mx-external-media-embed"]);
    this.update({
      hash: info.hash,
      title: titleFromUrl(info.source.href),
      source: info,
      enableWebview: viewType === MEDIA_WEBPAGE_VIEW_TYPE,
    });
  }
}

function injectUrlMediaEmbed(this: MxPlugin) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const plguin = this;
  this.registerMarkdownPostProcessor((el, ctx) => {
    for (const img of el.querySelectorAll("img")) {
      const info = extractSourceFromImg(img);
      if (!info) continue;
      replace(info, img);
    }
    for (const iframe of el.querySelectorAll<HTMLIFrameElement>(
      'iframe[src*="youtube.com/embed/"]',
    )) {
      const sourceText = ctx.getSectionInfo(iframe)?.text;
      const info =
        extractSourceFromMarkdown(sourceText) ??
        extractSourceFromIframe(iframe);
      if (!info) continue;
      const src = this.resolveUrl(info.url);
      if (!src) continue;
      replace(info, iframe);
    }

    function replace({ title, url }: EmbedSource, target: HTMLElement) {
      const src = plguin.resolveUrl(url);
      if (!src) return;
      const viewType = getSupportedViewType(src)[0];
      const newWarpper = createSpan({
        cls: ["media-embed", "external-embed", "is-loaded"],
        attr: {
          src: src.href,
          alt: title,
        },
      });
      target.replaceWith(newWarpper);
      ctx.addChild(
        new UrlEmbedMarkdownRenderChild(src, viewType, newWarpper, plguin),
      );
    }
  });
}

interface EmbedSource {
  url: string;
  title: string;
  size: Size | null;
}

function extractSourceFromImg(img: HTMLImageElement): EmbedSource | null {
  const linkTitle = img.alt,
    srcText = img.src;

  if (!srcText) return null;

  const [title, size] = parseSizeFromLinkTitle(linkTitle);
  return { url: srcText, title, size };
}

function extractSourceFromMarkdown(
  md: string | null | undefined,
): EmbedSource | null {
  if (!md) return null;
  const match = md.match(/!\[(?<alt>[^\]]*)\]\((?<src>[^)]+)\)/);
  if (!match) return null;
  const { alt: linkTitle, src: srcText } = match.groups!;
  if (!srcText) return null;
  const [title, size] = parseSizeFromLinkTitle(linkTitle);
  return { url: srcText, title, size };
}

function extractSourceFromIframe(
  iframe: HTMLIFrameElement,
): EmbedSource | null {
  console.warn("cannot get source text of iframe, use src instead");
  const srcText = iframe.src;
  if (!srcText) return null;
  return { url: srcText, title: titleFromUrl(srcText), size: null };
}
