import {
  Plugin,
  MarkdownPreviewRenderer,
  MarkdownView,
  parseLinktext,
  TFile,
} from "obsidian";
import { DEFAULT_SETTINGS, MESettingTab, MxSettings } from "./settings";
import "plyr/dist/plyr.css";
import "./main.css";
import { processExternalEmbeds } from "external-embed";
import { processInternalEmbeds } from "internal-embed";
import { processInternalLinks } from "internal-link";
import { onclick, processExternalLinks } from "external-link";
import { MediaView, MEDIA_VIEW_TYPE } from "modules/media-view";
import { getMediaType, getVideoInfo } from "modules/video-host/video-info";
import { Await } from "modules/misc";

const linkSelector = "span.cm-url, span.cm-hmd-internal-link";
export default class MediaExtended extends Plugin {
  settings: MxSettings = DEFAULT_SETTINGS;

  processInternalEmbeds = processInternalEmbeds.bind(this);
  processInternalLinks = processInternalLinks.bind(this);
  processExternalEmbeds = processExternalEmbeds.bind(this);
  processExternalLinks = processExternalLinks.bind(this);

  async loadSettings() {
    Object.assign(this.settings, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onload(): Promise<void> {
    console.log("loading media-extended");

    await this.loadSettings();

    this.addSettingTab(new MESettingTab(this.app, this));

    if (this.settings.mediaFragmentsEmbed) {
      this.registerMarkdownPostProcessor(this.processInternalEmbeds);
    }
    if (this.settings.timestampLink) {
      this.registerMarkdownPostProcessor(this.processInternalLinks);
    }
    if (this.settings.extendedImageEmbedSyntax) {
      this.registerMarkdownPostProcessor(this.processExternalEmbeds);
    }

    this.registerView(MEDIA_VIEW_TYPE, (leaf) => new MediaView(leaf));
    this.registerMarkdownPostProcessor(this.processExternalLinks);
    this.addCommand({
      id: "get-timestamp",
      name: "Get timestamp from player",
      checkCallback: (checking) => {
        const activeLeaf = this.app.workspace.activeLeaf;
        const getMediaView = (group: string) =>
          this.app.workspace
            // @ts-ignore
            .getGroupLeaves(group)
            .find((leaf) => (leaf.view as MediaView).getTimeStamp !== undefined)
            ?.view as MediaView | undefined;
        if (checking) {
          if (
            activeLeaf.view instanceof MarkdownView &&
            activeLeaf.view.getMode() === "source" &&
            // @ts-ignore
            activeLeaf.group
          ) {
            // @ts-ignore
            const mediaView = getMediaView(activeLeaf.group);
            if (mediaView && (mediaView as MediaView).getTimeStamp())
              return true;
          }
          return false;
        } else {
          getMediaView(
            // @ts-ignore
            activeLeaf.group,
          )?.addTimeStampToMDView(activeLeaf.view as MarkdownView);
        }
      },
    });

    this.registerCodeMirror((cm) => {
      const warpEl = cm.getWrapperElement();
      warpEl.on("mousedown", linkSelector, this.cmLinkHandler);
    });
  }

  cmLinkHandler = async (e: MouseEvent, del: HTMLElement) => {
    const text = del.innerText;
    const isMacOS = /Macintosh|iPhone/.test(navigator.userAgent);
    const modKey = isMacOS ? e.metaKey : e.ctrlKey;
    if (modKey) {
      let info: Await<ReturnType<typeof getVideoInfo>>;
      if (del.hasClass("cm-hmd-internal-link")) {
        const { path, subpath: hash } = parseLinktext(text);

        if (!getMediaType(path)) return;
        else e.stopPropagation();

        const activeLeaf = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeLeaf) {
          console.error("no MarkdownView activeLeaf found");
          return;
        }
        const file = this.app.metadataCache.getFirstLinkpathDest(
          path,
          activeLeaf.file.path,
        ) as TFile | null;
        if (!file) return;
        info = await getVideoInfo(file, hash, this.app.vault);
      } else {
        if (
          del.hasClass("cm-formatting") &&
          del.hasClass("cm-formatting-link-string")
        ) {
          let urlEl: Element | null;
          if (text === "(") urlEl = del.nextElementSibling;
          else if (text === ")") urlEl = del.previousElementSibling;
          else urlEl = null;
          if (urlEl === null || !(urlEl instanceof HTMLElement)) {
            console.error("unable to get url from: %o", del);
            return;
          }
          info = await getVideoInfo(urlEl.innerText);
        } else {
          info = await getVideoInfo(text);
        }
      }

      try {
        if (info) onclick(info, this.app.workspace)(e);
      } catch (e) {
        console.error(e);
      }
    }
  };

  onunload() {
    console.log("unloading media-extended");
    if (this.settings.mediaFragmentsEmbed) {
      MarkdownPreviewRenderer.unregisterPostProcessor(
        this.processInternalEmbeds,
      );
    }
    if (this.settings.timestampLink) {
      MarkdownPreviewRenderer.unregisterPostProcessor(
        this.processInternalLinks,
      );
    }
    if (this.settings.extendedImageEmbedSyntax) {
      MarkdownPreviewRenderer.unregisterPostProcessor(
        this.processExternalEmbeds,
      );
    }
    this.registerCodeMirror((cm) => {
      const warpEl = cm.getWrapperElement();
      warpEl.off("mousedown", linkSelector, this.cmLinkHandler);
    });
  }
}
