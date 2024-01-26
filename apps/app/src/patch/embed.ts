import type { EmbedCreator, Plugin } from "obsidian";
import { encodeWebpageUrl } from "@/lib/remote-player/encode";
import type { Size } from "@/lib/size-syntax";
import { parseSizeFromLinkTitle } from "@/lib/size-syntax";
import type { UrlMediaInfo } from "@/media-note/note-index/url-info";
import { parseUrl } from "@/media-note/note-index/url-info";
import { MediaRenderChild } from "@/media-view/url-embed";
import type MxPlugin from "@/mx-main";
import { MediaFileExtensions } from "./media-type";
import { reloadMarkdownPreview } from "./utils";

export default function injectMediaEmbed(
  this: MxPlugin,
  embedCreator: EmbedCreator,
) {
  injectFileMediaEmbed.call(this, embedCreator);
  injectUrlMediaEmbed.call(this);
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
    });
  }
}

function injectUrlMediaEmbed(this: MxPlugin) {
  this.registerMarkdownPostProcessor((el, ctx) => {
    for (const img of el.querySelectorAll("img")) {
      const info = extractSourceFromImg(img);
      if (!info) continue;
      const { title, original } = info;
      const newWarpper = createSpan({
        cls: ["media-embed", "external-embed", "is-loaded"],
        attr: {
          src: original,
          alt: title,
        },
      });
      img.replaceWith(newWarpper);
      ctx.addChild(new UrlEmbedMarkdownRenderChild(info, newWarpper, this));
    }
  });
}

interface ImgSource extends UrlMediaInfo {
  title: string;
  size: Size | null;
}

function extractSourceFromImg(img: HTMLImageElement): ImgSource | null {
  const linkTitle = img.alt,
    srcText = img.src;

  const src = parseUrl(srcText);
  if (!src) return null;

  const [title, size] = parseSizeFromLinkTitle(linkTitle);
  return { ...src, title, size };
}
