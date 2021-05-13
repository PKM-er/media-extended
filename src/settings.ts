import { App, PluginSettingTab, Setting } from "obsidian";
import MediaExtended from "./main";

export interface MxSettings {
  mediaFragmentsEmbed: boolean;
  timestampLink: boolean;
  extendedImageEmbedSyntax: boolean;
  thumbnailPlaceholder: boolean;
}

export const DEFAULT_SETTINGS: MxSettings = {
  mediaFragmentsEmbed: true,
  timestampLink: false,
  extendedImageEmbedSyntax: false,
  thumbnailPlaceholder: false,
};

export class MESettingTab extends PluginSettingTab {
  plugin: MediaExtended;

  constructor(app: App, plugin: MediaExtended) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    const options: option[] = [
      {
        k: "mediaFragmentsEmbed",
        name: "Embed Media Fragments",
        desc: createFragment((descEl) => {
          descEl.appendText(
            "If enabled, you can write ![[demo.mp4#t=10]] to embed the specific fragment of video/audio. ",
          );
          descEl.createEl("br");
          descEl.appendText(
            "Loop is also available by append #loop or #t=...&loop to the end of filename",
          );
          descEl.createEl("br");
          descEl.appendText("Restart the app to take effects");
        }),
      },
      {
        k: "timestampLink",
        name: "Timestamps for Media",
        desc: createFragment((descEl) => {
          descEl.appendText(
            "If enabled, you can write [[demo.mp4#t=10]] to create timestamp link to the video/audio. Click on the link would open the media file if it's not opened yet. ",
          );
          descEl.createEl("br");
          descEl.appendText(
            "PS: Only works in preview mode, hover preview on link is not available",
          );
          descEl.createEl("br");
          descEl.appendText("Restart the app to take effects");
        }),
      },
      {
        k: "extendedImageEmbedSyntax",
        name: "Extended Image Embed Syntax",
        desc: createFragment((descEl) => {
          descEl.appendText(
            "If enabled, you can write ![](link/to/demo.mp4) to embed video and audio.",
          );
          descEl.createEl("br");
          descEl.appendText(
            "Support direct file links (with file extension) and videos from video hosts (Youtube, Bilibili)",
          );
          descEl.createEl("br");
          descEl.appendText("Restart the app to take effects");
        }),
      },
      {
        k: "thumbnailPlaceholder",
        name: "Placeholder in favor of full player",
        desc: createFragment((descEl) => {
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
        }),
      },
    ];

    for (const o of options) {
      setOption(o, this);
    }
  }
}
type option = {
  k: keyof MxSettings;
  name: string;
  desc: string | DocumentFragment;
};
function setOption({ k, name, desc }: option, tab: MESettingTab) {
  new Setting(tab.containerEl)
    .setName(name)
    .setDesc(desc)
    .addToggle((toggle) =>
      toggle.setValue(tab.plugin.settings[k]).onChange(async (value) => {
        tab.plugin.settings[k] = value;
        tab.plugin.saveData(tab.plugin.settings);
        tab.display();
      }),
    );
}
