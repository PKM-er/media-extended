import "plyr/dist/plyr.css";
import "./main.css";

import { Plugin } from "obsidian";

import { getEmbedProcessor } from "./embeds";
import { getCMLinkHandler, getLinkProcessor } from "./links";
import { MEDIA_VIEW_TYPE, MediaView } from "./media-view";
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

    this.registerView(MEDIA_VIEW_TYPE, (leaf) => new MediaView(leaf, this));
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
  }

  // onunload() {
  //   console.log("unloading media-extended");
  // }
}
