import "plyr/dist/plyr.css";
import "./style/main.less";
import "./style/ytb.less";
import "./style/caption-fix.less";

import assertNever from "assert-never";
import { ExtensionAccepted, MediaType } from "mx-lib/";
import { Plugin } from "obsidian";

import { getEmbedProcessor } from "./embeds";
import { getCMLinkHandler, getLinkProcessor } from "./links";
import { MEDIA_VIEW_TYPE, MediaView, PromptModal } from "./media-view";
import { setupRec } from "./modules/audio-rec";
import {
  DEFAULT_SETTINGS,
  hideYtbRecommClass,
  MESettingTab,
  MxSettings,
  SizeSettings,
} from "./settings";

const linkSelector = "span.cm-url, span.cm-hmd-internal-link";
export default class MediaExtended extends Plugin {
  settings: MxSettings = DEFAULT_SETTINGS;

  recStartTime: number | null = null;

  private cmLinkHandler = getCMLinkHandler(this);

  async loadSettings() {
    this.settings = { ...this.settings, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  setEmbedMinWidth = (value?: string) =>
    document.documentElement.style.setProperty(
      "--plyr-min-width",
      value ?? this.sizeSettings.embedMinWidth,
    );
  get sizeSettings() {
    return {
      embedMaxHeight: this.app.isMobile
        ? this.settings.embedMaxHeightMobile
        : this.settings.embedMaxHeight,
      embedMinWidth: this.app.isMobile
        ? this.settings.embedMinWidthMobile
        : this.settings.embedMinWidth,
      plyrControls: this.app.isMobile
        ? this.settings.plyrControlsMobile
        : this.settings.plyrControls,
    };
  }
  setSizeSettings = async (to: Partial<SizeSettings>): Promise<void> => {
    let save: Partial<MxSettings>;
    if (this.app.isMobile) {
      save = {
        embedMaxHeightMobile: to.embedMaxHeight,
        embedMinWidthMobile: to.embedMinWidth,
        plyrControlsMobile: to.plyrControls,
      };
    } else {
      save = to;
    }
    const mergeObject = (A: any, B: any) => {
      let res: any = {};
      Object.keys({ ...A, ...B }).map((key) => {
        res[key] = B[key] || A[key];
      });
      return res;
    };
    this.settings = mergeObject(this.settings, save);
    await this.saveSettings();
  };

  async onload(): Promise<void> {
    console.log("loading media-extended");

    await this.loadSettings();

    setupRec.call(this);

    document.body.toggleClass(hideYtbRecommClass, this.settings.hideYtbRecomm);
    this.setEmbedMinWidth();

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
    this.registerView(MEDIA_VIEW_TYPE, (leaf) => new MediaView(leaf, this));
    this.app.viewRegistry.registerExtensions(exts, MEDIA_VIEW_TYPE);
  }

  unregisterExtensions() {
    this.app.viewRegistry.unregisterExtensions(getExts());
    for (const [type, exts] of ExtensionAccepted) {
      switch (type) {
        case MediaType.Audio:
        case MediaType.Video:
          this.app.viewRegistry.registerExtensions(exts, type);
          break;
        case MediaType.Unknown:
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
  [...ExtensionAccepted.values()].reduce((acc, val) => acc.concat(val), []);
