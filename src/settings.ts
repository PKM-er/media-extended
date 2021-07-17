import { App, PluginSettingTab, Setting } from "obsidian";
import MediaExtended from "./main";

export interface MxSettings {
  mediaFragmentsEmbed: boolean;
  timestampLink: boolean;
  extendedImageEmbedSyntax: boolean;
  thumbnailPlaceholder: boolean;
  useYoutubeControls: boolean;
  interalBiliPlayback: boolean;
}

export const DEFAULT_SETTINGS: MxSettings = {
  mediaFragmentsEmbed: true,
  timestampLink: false,
  extendedImageEmbedSyntax: false,
  thumbnailPlaceholder: false,
  useYoutubeControls: false,
  interalBiliPlayback: false,
};

export class MESettingTab extends PluginSettingTab {
  plugin: MediaExtended;

  constructor(app: App, plugin: MediaExtended) {
    super(app, plugin);
    this.plugin = plugin;
  }

  setToggle = ({ k, name, desc }: option) => {
    let { settings } = this.plugin;
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(typeof desc === "string" ? desc : createFragment(desc))
      .addToggle((toggle) =>
        toggle.setValue(settings[k]).onChange(async (value) => {
          settings[k] = value;
          this.plugin.saveData(settings);
          this.display();
        }),
      );
  };

  display(): void {
    let { containerEl, setToggle } = this;

    containerEl.empty();

    setToggle({
      k: "mediaFragmentsEmbed",
      name: "Embed Media Fragments",
      desc: (descEl) => {
        descEl.appendText(
          "If enabled, you can write ![[demo.mp4#t=10]] to embed the specific fragment of video/audio. ",
        );
        descEl.createEl("br");
        descEl.appendText(
          "Loop is also available by append #loop or #t=...&loop to the end of filename",
        );
        descEl.createEl("br");
        descEl.appendText("Restart the app to take effects");
      },
    });

    setToggle({
      k: "mediaFragmentsEmbed",
      name: "Embed Media Fragments",
      desc: (descEl) => {
        descEl.appendText(
          "If enabled, you can write ![[demo.mp4#t=10]] to embed the specific fragment of video/audio. ",
        );
        descEl.createEl("br");
        descEl.appendText(
          "Loop is also available by append #loop or #t=...&loop to the end of filename",
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
        descEl.appendText(
          "Support direct file links (with file extension) and videos from video hosts (Youtube, Bilibili)",
        );
        descEl.createEl("br");
        descEl.appendText("Restart the app to take effects");
      },
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

    // @ts-ignore
    const isMobile: boolean = this.app.isMobile;
    if (!isMobile)
      setToggle({
        k: "interalBiliPlayback",
        name: "Play bilibili video with local player",
        desc: (descEl) => {
          descEl.appendText(
            "在本地播放Bilibili视频，替代嵌入式iframe播放器，支持播放1080p视频",
          );
          descEl.createEl("br");
          descEl.appendText("bilibili视频的时间戳功能需要开启该功能");
          descEl.createEl("br");
          descEl.appendText("注意：移动版不支持，重启Obsidian生效");
        },
      });
  }
}
type option = {
  k: keyof MxSettings;
  name: string;
  desc: string | ((el: DocumentFragment) => void);
};
