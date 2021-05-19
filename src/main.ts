import { Plugin, MarkdownPreviewRenderer, MarkdownView } from "obsidian";
import { DEFAULT_SETTINGS, MESettingTab, MxSettings } from "./settings";
import "plyr/dist/plyr.css";
import "./main.css";
import { processExternalEmbeds } from "external-embed";
import { processInternalEmbeds } from "internal-embed";
import { processInternalLinks } from "internal-link";
import { onclick, processExternalLinks } from "external-link";
import { ExternalMediaView, EX_VIEW_TYPE } from "modules/media-view";
import { getVideoInfo } from "modules/video-host/video-info";

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

    this.registerView(EX_VIEW_TYPE, (leaf) => new ExternalMediaView(leaf));
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
            .find(
              (leaf) =>
                (leaf.view as ExternalMediaView).getTimeStamp !== undefined,
            )?.view as ExternalMediaView | undefined;
        if (checking) {
          if (
            activeLeaf.view instanceof MarkdownView &&
            activeLeaf.view.getMode() === "source" &&
            // @ts-ignore
            activeLeaf.group
          ) {
            // @ts-ignore
            const mediaView = getMediaView(activeLeaf.group);
            if (mediaView && (mediaView as ExternalMediaView).getTimeStamp())
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
      warpEl.on(
        "mousedown",
        "span.cm-url:not(.cm-formatting)",
        this.cmLinkHandler,
      );
    });
  }

  cmLinkHandler = (e: MouseEvent, del: HTMLElement) => {
    const link = del.innerText;
    const info = getVideoInfo(link);
    const isMacOS = /Macintosh|iPhone/.test(navigator.userAgent);
    const modKey = isMacOS ? e.metaKey : e.ctrlKey;
    if (info && modKey) {
      e.stopPropagation();
      onclick(info, this.app.workspace)(e);
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
      warpEl.off(
        "mousedown",
        "span.cm-url:not(.cm-formatting)",
        this.cmLinkHandler,
      );
    });
  }
}
