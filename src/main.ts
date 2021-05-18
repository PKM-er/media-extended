import { Plugin, MarkdownPreviewRenderer } from "obsidian";
import { DEFAULT_SETTINGS, MESettingTab, MxSettings } from "./settings";
import "plyr/dist/plyr.css";
import "./main.css";
import { processExternalEmbeds } from "external-embed";
import { processInternalEmbeds } from "internal-embed";
import { processInternalLinks } from "internal-link";
import { processExternalLinks } from "external-link";
import { ExternalMediaView, EX_VIEW_TYPE } from "modules/media-view";

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

    // this.registerMarkdownPostProcessor(processVideoPlayer.bind(this));
  }

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
  }
}
