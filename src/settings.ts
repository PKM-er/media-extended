import { isCssValue } from "@tinyfe/parse-unit";
import { App, debounce, PluginSettingTab, Setting } from "obsidian";

import { getPortSetting, isAvailable } from "./modules/bili-bridge";
import { PlyrControls, PlyrControlsSetting } from "./modules/plyr-controls";
import MediaExtended from "./mx-main";

export const hideYtbRecommClass = "alx-hide-ytb-recomm";

export interface MxSettings {
  mediaFragmentsEmbed: boolean;
  timestampLink: boolean;
  extendedImageEmbedSyntax: boolean;
  thumbnailPlaceholder: boolean;
  useYoutubeControls: boolean;
  interalBiliPlayback: boolean;
  embedHeight: string;
  hideYtbRecomm: boolean;
  plyrControls: Record<PlyrControls, boolean>;
}

export const DEFAULT_SETTINGS: MxSettings = {
  mediaFragmentsEmbed: true,
  timestampLink: true,
  extendedImageEmbedSyntax: true,
  thumbnailPlaceholder: false,
  useYoutubeControls: false,
  interalBiliPlayback: true,
  embedHeight: "30vh",
  hideYtbRecomm: false,
  plyrControls: {
    restart: false, // Restart playback
    rewind: false, // Rewind by the seek time (default 10 seconds)
    play: true, // Play/pause playback
    "fast-forward": false, // Fast forward by the seek time (default 10 seconds)
    progress: true, // The progress bar and scrubber for playback and buffering
    "current-time": true, // The current time of playback
    duration: true, // The full duration of the media
    mute: false, // Toggle mute
    volume: true, // Volume control
    captions: true, // Toggle captions
    settings: true, // Settings menu
    pip: false, // Picture-in-picture (currently Safari only)
    fullscreen: true, // Toggle fullscreen
  },
};

export const recToPlyrControls = (rec: Record<PlyrControls, boolean>) =>
  ([...Object.entries(rec)] as [PlyrControls, boolean][])
    .filter((v) => v[1])
    .map((v) => v[0]);

type option = {
  k: keyof MxSettings;
  name: string;
  desc: string | ((el: DocumentFragment) => void);
};
export class MESettingTab extends PluginSettingTab {
  plugin: MediaExtended;

  constructor(app: App, plugin: MediaExtended) {
    super(app, plugin);
    this.plugin = plugin;
  }

  setToggle = (
    { k, name, desc }: option,
    onChange?: (value: boolean) => any,
  ) => {
    let { settings } = this.plugin;
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(typeof desc === "string" ? desc : createFragment(desc))
      .addToggle((toggle) => {
        const oldValue = settings[k];
        if (typeof oldValue === "boolean") {
          toggle.setValue(oldValue).onChange(async (value) => {
            if (onChange) onChange(value);
            // @ts-ignore
            settings[k] = value;
            this.plugin.saveData(settings);
            this.display();
          });
        } else throw new TypeError("toggle not boolean");
      });
  };

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    this.general();
    this.player();
    this.ytb();
    this.bili();
  }

  general(): void {
    let { containerEl } = this;
    const { setToggle } = this;

    containerEl.createEl("h2", { text: "General" });
    setToggle({
      k: "mediaFragmentsEmbed",
      name: "Embed Media Fragments",
      desc: (descEl) => {
        descEl.appendText(
          "If enabled, you can write ![[demo.mp4#t=10]] to embed the specific fragment of video/audio. ",
        );
        descEl.createEl("br");
        descEl.appendText(
          "Loop is also available by appending #loop or #t=...&loop to filename",
        );
        descEl.createEl("br");
        descEl.appendText("Restart the app to take effects");
      },
    });
    setToggle({
      k: "timestampLink",
      name: "Timestamps for Media",
      desc: (descEl) => {
        descEl.appendText(
          "If enabled, you can write [[demo.mp4#t=10]] to create timestamp link to the video/audio. Click on the link would open the media file if it's not opened yet. ",
        );
        descEl.createEl("br");
        descEl.appendText(
          "PS: Only works in preview mode, hover preview on link is not available",
        );
        descEl.createEl("br");
        descEl.appendText("Restart the app to take effects");
      },
    });

    setToggle({
      k: "extendedImageEmbedSyntax",
      name: "Extended Image Embed Syntax",
      desc: (descEl) => {
        descEl.appendText(
          "If enabled, you can write ![](link/to/demo.mp4) to embed video and audio.",
        );
        descEl.createEl("br");
        descEl.appendText("Timestamps and fragments are also available");
        descEl.createEl("br");
        descEl.appendText(
          "Support direct file links (local/remote) and videos from video hosts (Youtube, Bilibili...)",
        );
        descEl.createEl("br");
        descEl.appendText("Restart the app to take effects");
      },
    });
  }
  player(): void {
    let { containerEl } = this;
    const { setToggle } = this;

    containerEl.createEl("h2", { text: "Player" });

    const plyrControls = new Setting(containerEl)
      .setName("Plyr Controls")
      .setDesc(
        createFragment((descEl) => {
          descEl.appendText("Show or hide certain plyr controls");
          descEl.createEl("br");
          descEl.appendText("Restart the app to take effects");
        }),
      );
    new PlyrControlsSetting(plyrControls.settingEl.createDiv(), this.plugin);

    new Setting(containerEl)
      .setName("Maximum Player Height for Embeds")
      .setDesc("Reload preview to take effects")
      .addText((text) => {
        const save = debounce(
          async (value: string) => {
            this.plugin.settings.embedHeight = value;
            await this.plugin.saveSettings();
          },
          500,
          true,
        );
        text
          .setValue(this.plugin.settings.embedHeight)
          .onChange(async (value: string) => {
            text.inputEl.toggleClass("incorrect", !isCssValue(value));
            if (isCssValue(value)) save(value);
          });
      });

    setToggle({
      k: "thumbnailPlaceholder",
      name: "Placeholder in favor of full player",
      desc: (descEl) => {
        descEl.appendText(
          "If enabled, thumbnail placeholder will be used in favor of full player when page loads",
        );
        descEl.createEl("br");
        descEl.appendText("Works with for Youtube/Vimeo/Bilibili embeds");
        descEl.createEl("br");
        descEl.appendText(
          "Helpful when numerous video from Youtube/Vimeo/... is embeded in one single file",
        );
        descEl.createEl("br");
        descEl.appendText("Restart the app to take effects");
      },
    });
  }
  ytb(): void {
    let { containerEl } = this;
    const { setToggle } = this;

    containerEl.createEl("h2", { text: "Youtube" });

    setToggle({
      k: "useYoutubeControls",
      name: "Use Youtube Built-in Controls",
      desc: (descEl) => {
        descEl.appendText(
          "If enabled, Youtube's built-in Controls will be used in favor of Plyr controls",
        );
        descEl.createEl("br");
        descEl.appendText(
          "Useful when need access to CC (Closed Captioning) and chapters progress bar",
        );
        descEl.createEl("br");
        descEl.appendText("Restart the app to take effects");
      },
    });
    if (!this.plugin.settings.useYoutubeControls) {
      setToggle(
        {
          k: "hideYtbRecomm",
          name: "Hide Recommend Videos",
          desc: "Blur on pause to hide annoying recommend videos, ignored when Youtube Built-in Controls enabled",
        },
        (value) => document.body.toggleClass(hideYtbRecommClass, value),
      );
    }
  }
  bili(): void {
    let { containerEl } = this;

    containerEl.createEl("h2", { text: "Bilibili" });

    const internalBili = new Setting(containerEl)
      .setName("高级BiliBili支持")
      .setDesc(
        createFragment((desc) => {
          desc.appendText(
            "替代嵌入式iframe播放器，支持时间戳、播放1080p视频等",
          );
          desc.createEl("br");
          if (this.app.isMobile) desc.appendText("移动版尚不支持");
          else if (!isAvailable(this.app)) {
            desc.appendText("BiliBili Plugin尚未启用，");
            desc.createEl("a", {
              href: "https://github.com/aidenlx/mx-bili-plugin",
              text: "点此下载",
            });
          }
        }),
      );
    if (!this.app.isMobile && isAvailable(this.app)) {
      internalBili.addToggle((toggle) => {
        let { settings } = this.plugin;
        toggle
          .setValue(settings.interalBiliPlayback)
          .onChange(async (value) => {
            settings.interalBiliPlayback = value;
            this.plugin.saveData(settings);
            this.display();
          });
      });
      getPortSetting(this.app)(containerEl);
    }
  }
}
