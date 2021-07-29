import "plyr/dist/plyr.css";
import "./style/main.css";
import "./style/ytb.css";

import assertNever from "assert-never";
import { Plugin } from "obsidian";

import { getEmbedProcessor } from "./embeds";
import { getCMLinkHandler, getLinkProcessor } from "./links";
import { MEDIA_VIEW_TYPE, MediaView, PromptModal } from "./media-view";
import { acceptedExt } from "./modules/media-info";
import {
  DEFAULT_SETTINGS,
  hideYtbRecommClass,
  MESettingTab,
  MxSettings,
} from "./settings";

const linkSelector = "span.cm-url, span.cm-hmd-internal-link";
export default class MediaExtended extends Plugin {
  settings: MxSettings = DEFAULT_SETTINGS;

  private cmLinkHandler = getCMLinkHandler(this);

  async loadSettings() {
    Object.assign(this.settings, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onload(): Promise<void> {
    console.log("loading media-extended");

    await this.loadSettings();

    document.body.toggleClass(hideYtbRecommClass, this.settings.hideYtbRecomm);
    document.documentElement.style.setProperty(
      "--plyr-min-width",
      this.settings.embedMinWidth,
    );

    this.addSettingTab(new MESettingTab(this.app, this));

    // register embed handlers
    if (this.settings.mediaFragmentsEmbed) {
      this.registerMarkdownPostProcessor(getEmbedProcessor(this, "internal"));
    }
    if (this.settings.timestampLink) {
      this.registerMarkdownPostProcessor(getLinkProcessor(this, "internal"));
    }

    // register link handlers
    if (this.settings.extendedImageEmbedSyntax) {
      this.registerMarkdownPostProcessor(getEmbedProcessor(this, "external"));
    }
    this.registerMarkdownPostProcessor(getLinkProcessor(this, "external"));

    if (!this.app.isMobile) {
      this.registerCodeMirror((cm) => {
        const warpEl = cm.getWrapperElement();
        warpEl.on("mousedown", linkSelector, this.cmLinkHandler);
        this.register(() =>
          warpEl.off("mousedown", linkSelector, this.cmLinkHandler),
        );
      });
    }

    this.registerExtensions();

    this.addCommand({
      id: "get-timestamp",
      name: "Get timestamp from player",
      editorCheckCallback: (checking, _editor, view) => {
        const getMediaView = (group: string) =>
          this.app.workspace
            .getGroupLeaves(group)
            .find((leaf) => (leaf.view as MediaView).getTimeStamp !== undefined)
            ?.view as MediaView | undefined;
        const group: null | string = view.leaf.group;
        if (checking) {
          if (group) {
            const mediaView = getMediaView(group);
            if (mediaView && (mediaView as MediaView).getTimeStamp())
              return true;
          }
          return false;
        } else if (group) {
          getMediaView(group)?.addTimeStampToMDView(view);
        }
      },
    });
    this.addCommand({
      id: "open-media-link",
      name: "Open Media from Link",
      callback: () => {
        new PromptModal(this).open();
      },
    });
  }

  registerExtensions() {
    const exts = getExts();
    this.app.viewRegistry.unregisterExtensions(exts);
    this.app.viewRegistry.registerViewWithExtensions(
      exts,
      MEDIA_VIEW_TYPE,
      (leaf) => new MediaView(leaf, this),
    );
  }

  unregisterExtensions() {
    this.app.viewRegistry.unregisterExtensions(getExts());
    for (const [type, exts] of acceptedExt) {
      switch (type) {
        case "audio":
        case "video":
          this.app.viewRegistry.registerExtensions(exts, type);
          break;
        case "media":
          this.app.viewRegistry.registerExtensions(exts, "video");
          break;
        default:
          assertNever(type);
      }
    }
  }

  onunload() {
    console.log("unloading media-extended");
    this.unregisterExtensions();
  }
}

const getExts = () =>
  [...acceptedExt.values()].reduce((acc, val) => acc.concat(val), []);
