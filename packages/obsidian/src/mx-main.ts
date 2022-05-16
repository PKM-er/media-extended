import "./style/main.less";
import "./style/ytb.less";
import "./style/caption-fix.less";

import { ExtensionAccepted } from "@base/media-type";
import { registerIPCMain } from "@ipc/hack";
import { DEFAULT_SETTINGS, MESettingTab, MxSettings } from "@settings";
import { MEDIA_VIEW_TYPE, MediaView, patchLeaf, ToggleMediaPin } from "@view";
import assertNever from "assert-never";
import Color from "color";
import { merge } from "lodash-es";
import { FileSystemAdapter, Platform, Plugin } from "obsidian";
import { join } from "path";

import { INJECT_BILIBILI } from "./const.mjs";
import { setupRec } from "./feature/audio-rec";
import { registerInsetTimestampHandler } from "./feature/insert-timestamp";
import { registerGlobalControlCmd } from "./feature/keyboard-control";
import registerOpenMediaLink from "./feature/open-media";
import { registerSaveScreenshotHandler } from "./feature/save-screenshot";
import { getMostRecentViewOfType } from "./misc";
import { SetAuth } from "./player/ipc/hack/const";
import registerEmbedHandlers from "./render/embed";
import registerLinkHandlers from "./render/links";

export default class MediaExtended extends Plugin {
  settings: MxSettings = DEFAULT_SETTINGS;

  recStartTime: number | null = null;

  async loadSettings() {
    this.settings = merge(this.settings, await this.loadData());
    Platform.isDesktopApp &&
      require("electron").ipcRenderer.send(SetAuth, this.settings.auths);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // setEmbedMinWidth = (value?: string) =>
  //   document.documentElement.style.setProperty(
  //     "--plyr-min-width",
  //     value ?? this.sizeSettings.embedMinWidth,
  //   );
  // get sizeSettings() {
  //   return {
  //     embedMaxHeight: this.app.isMobile
  //       ? this.settings.embedMaxHeightMobile
  //       : this.settings.embedMaxHeight,
  //     embedMinWidth: this.app.isMobile
  //       ? this.settings.embedMinWidthMobile
  //       : this.settings.embedMinWidth,
  //     plyrControls: this.app.isMobile
  //       ? this.settings.plyrControlsMobile
  //       : this.settings.plyrControls,
  //   };
  // }
  // setSizeSettings = async (to: Partial<SizeSettings>): Promise<void> => {
  //   let save: Partial<MxSettings>;
  //   if (this.app.isMobile) {
  //     save = {
  //       embedMaxHeightMobile: to.embedMaxHeight,
  //       embedMinWidthMobile: to.embedMinWidth,
  //       plyrControlsMobile: to.plyrControls,
  //     };
  //   } else {
  //     save = to;
  //   }
  //   const mergeObject = (A: any, B: any) => {
  //     let res: any = {};
  //     Object.keys({ ...A, ...B }).map((key) => {
  //       res[key] = B[key] || A[key];
  //     });
  //     return res;
  //   };
  //   this.settings = mergeObject(this.settings, save);
  //   await this.saveSettings();
  // };

  async onload(): Promise<void> {
    console.log("loading media-extended");
    this.register(registerIPCMain(this));

    await this.loadSettings();
    if (Platform.isDesktopApp && this.manifest.dir) {
      this.BilibiliInjectCode = this.app.vault.adapter
        .read(join(this.manifest.dir, INJECT_BILIBILI))
        .catch(
          (error) => (
            console.log("no bilibili inject code found", error), null
          ),
        );
    }

    patchLeaf(this);

    const { workspace } = this.app;

    // reload prevoisly opened media views
    workspace.onLayoutReady(() =>
      workspace.iterateAllLeaves(async (leaf) => {
        if (
          leaf.view?.getViewType() === MEDIA_VIEW_TYPE &&
          !(leaf.view instanceof MediaView)
        ) {
          const state = leaf.getViewState();
          await leaf.setViewState({ type: "empty" });
          await leaf.setViewState(state);
        }
      }),
    );

    updateAccentColor();
    this.registerEvent(this.app.workspace.on("css-change", updateAccentColor));

    setupRec.call(this);

    // document.body.toggleClass(hideYtbRecommClass, this.settings.hideYtbRecomm);
    // this.setEmbedMinWidth();

    this.addSettingTab(new MESettingTab(this.app, this));

    registerLinkHandlers(this);
    registerEmbedHandlers(this);

    registerGlobalControlCmd(this);
    registerInsetTimestampHandler(this);
    registerSaveScreenshotHandler(this);
    registerOpenMediaLink(this);

    this.registerExtensions();
  }

  registerExtensions() {
    const exts = getExts();
    this.app.viewRegistry.unregisterExtensions(exts);
    this.registerView(MEDIA_VIEW_TYPE, (leaf) => new MediaView(leaf, this));
    this.addCommand(ToggleMediaPin);
    this.app.viewRegistry.registerExtensions(exts, MEDIA_VIEW_TYPE);
  }

  unregisterExtensions() {
    this.app.viewRegistry.unregisterExtensions(getExts());
    for (const [type, exts] of ExtensionAccepted) {
      switch (type) {
        case "audio":
        case "video":
          this.app.viewRegistry.registerExtensions(exts, type);
          break;
        case "unknown":
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

  getFullPluginDir() {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter) || !this.manifest.dir) return;
    return adapter.getFullPath(this.manifest.dir);
  }

  BilibiliInjectCode?: Promise<string | null>;
}

const getExts = () =>
  [...ExtensionAccepted.values()].reduce((acc, val) => acc.concat(val), []);

const updateAccentColor = () => {
  const div = createDiv();
  div.addClass("theme-light");
  div.style.display = "none";
  div.style.color = "var(--interactive-accent)";
  document.body.append(div);
  const colorLight = Color(getComputedStyle(div).color);
  div.removeClass("theme-light");
  div.addClass("theme-dark");
  const colorDark = Color(getComputedStyle(div).color);
  div.remove();
  document.body.style.setProperty(
    "--mx-interactive-accent",
    colorLight.saturate(10).string(),
  );
  document.body.style.setProperty(
    "--mx-interactive-accent-secondary",
    colorLight.lighten(0.2).string(),
  );
  document.body.style.setProperty(
    "--mx-dark-interactive-accent-secondary",
    colorDark.lighten(0.3).string(),
  );
};

const getObMediaView = () => getMostRecentViewOfType(MediaView);
