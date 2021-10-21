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
  hideYtbRecomm: boolean;
  embedMaxHeight: string;
  embedMaxHeightMobile: string;
  embedMinWidth: string;
  embedMinWidthMobile: string;
  plyrControls: Record<PlyrControls, boolean>;
  plyrControlsMobile: Record<PlyrControls, boolean>;
  timestampTemplate: string;
  timestampOffset: number;
  hideEmbedControls: boolean;
}

export const DEFAULT_SETTINGS: MxSettings = {
  mediaFragmentsEmbed: true,
  timestampLink: true,
  extendedImageEmbedSyntax: true,
  thumbnailPlaceholder: false,
  useYoutubeControls: false,
  interalBiliPlayback: true,
  hideYtbRecomm: false,
  embedMaxHeight: "30vh",
  embedMinWidth: "400px",
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
  embedMaxHeightMobile: "20vh",
  embedMinWidthMobile: "200px",
  plyrControlsMobile: {
    restart: false, // Restart playback
    rewind: false, // Rewind by the seek time (default 10 seconds)
    play: true, // Play/pause playback
    "fast-forward": false, // Fast forward by the seek time (default 10 seconds)
    progress: true, // The progress bar and scrubber for playback and buffering
    "current-time": false, // The current time of playback
    duration: false, // The full duration of the media
    mute: false, // Toggle mute
    volume: true, // Volume control
    captions: true, // Toggle captions
    settings: true, // Settings menu
    pip: false, // Picture-in-picture (currently Safari only)
    fullscreen: true, // Toggle fullscreen
  },
  timestampTemplate: "\n{{TIMESTAMP}}\n",
  timestampOffset: 0,
  hideEmbedControls: false,
};

export type SizeSettings = {
  embedMaxHeight: string;
  embedMinWidth: string;
  plyrControls: Record<PlyrControls, boolean>;
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
    this.noteTaking();
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
          "Support direct file links (local/remote) and videos from video hosts (Youtube, bilibili...)",
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

    setToggle({
      k: "thumbnailPlaceholder",
      name: "Placeholder in favor of full player",
      desc: (descEl) => {
        descEl.appendText(
          "If enabled, thumbnail placeholder will be used in favor of full player when page loads",
        );
        descEl.createEl("br");
        descEl.appendText("Works with for Youtube/Vimeo/bilibili embeds");
        descEl.createEl("br");
        descEl.appendText(
          "Helpful when numerous video from Youtube/Vimeo/... is embeded in one single file",
        );
        descEl.createEl("br");
        descEl.appendText("Restart the app to take effects");
      },
    });
    setToggle({
      k: "hideEmbedControls",
      name: "Hide Embed Controls By Default",
      desc: (descEl) => {
        descEl.appendText(
          "If enabled, embeds are rendered similar to images with all controls hidden, click on embeds to play/pause",
        );
        descEl.createEl("br");
        descEl.appendText(
          "You can still enable controls manually by append #controls to link",
        );
        descEl.createEl("br");
        descEl.appendText("Restart the app to take effects");
      },
    });

    const plyrControls = new Setting(containerEl)
      .setName("Plyr Controls")
      .setDesc(
        createFragment((descEl) => {
          descEl.appendText("Show or hide certain plyr controls");
          descEl.createEl("br");
          descEl.appendText("Restart the app to take effects");
        }),
      );
    new PlyrControlsSetting(
      plyrControls.settingEl.createDiv({ cls: "plyr-ctrls-container" }),
      this.plugin,
    );

    new Setting(containerEl)
      .setName("Maximum Player Height for Embeds")
      .setDesc("Reload app to take effects")
      .addText((text) => {
        const save = debounce(
          async (value: string) =>
            await this.plugin.setSizeSettings({ embedMaxHeight: value }),
          500,
          true,
        );
        text
          .setValue(this.plugin.sizeSettings.embedMaxHeight)
          .onChange(async (value: string) => {
            text.inputEl.toggleClass("incorrect", !isCssValue(value));
            if (isCssValue(value)) save(value);
          });
      });
    new Setting(containerEl)
      .setName("Minimum Player Width for Embeds")
      .addText((text) => {
        const save = debounce(
          async (value: string) => {
            this.plugin.setEmbedMinWidth(value);
            await this.plugin.setSizeSettings({ embedMinWidth: value });
          },
          500,
          true,
        );
        text
          .setValue(this.plugin.sizeSettings.embedMinWidth)
          .onChange(async (value: string) => {
            text.inputEl.toggleClass("incorrect", !isCssValue(value));
            if (isCssValue(value)) save(value);
          });
      });
  }
  noteTaking(): void {
    let { containerEl } = this;

    containerEl.createEl("h2", { text: "Note Taking" });

    new Setting(containerEl)
      .setName("Timestamp Template")
      .setDesc(
        createFragment((descEl) => {
          descEl.appendText("The template used to insert timestamps.");
          descEl.createEl("br");
          descEl.appendText("Supported placeholders: {{TIMESTAMP}}");
        }),
      )
      .addTextArea((text) => {
        const onChange = async (value: string) => {
          this.plugin.settings.timestampTemplate = value;
          await this.plugin.saveSettings();
        };
        text
          .setValue(this.plugin.settings.timestampTemplate)
          .onChange(debounce(onChange, 500, true));
        text.inputEl.rows = 5;
        text.inputEl.cols = 20;
      });

    new Setting(containerEl)
      .setName("Timestamp Offset")
      .setDesc(
        createFragment((descEl) => {
          descEl.appendText("Amount of seconds to offset timestamps.");
          descEl.createEl("br");
          descEl.appendText("Set postive value to offset forward, vice versa");
        }),
      )
      .addText((text) => {
        const save = debounce(
          async (value: string) => {
            this.plugin.settings.timestampOffset = Number(value);
            await this.plugin.saveSettings();
          },
          500,
          true,
        );
        text
          .setValue(String(this.plugin.settings.timestampOffset))
          .onChange(async (value: string) => {
            text.inputEl.toggleClass("incorrect", isNaN(Number(value)));
            if (!isNaN(Number(value))) save(value);
          });
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

    containerEl.createEl("h2", { text: "bilibili" });

    const internalBili = new Setting(containerEl)
      .setName("高级bilibili支持")
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
