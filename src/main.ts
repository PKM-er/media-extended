import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { processInternalEmbeds, processExternalEmbeds, processInternalLinks } from "./processor";
// import Plyr from "plyr"

interface MxSettings {
  enableInLinkMF: boolean;
  enableInEmbedMF: boolean;
  allowEmbedMedia: boolean;

}

const DEFAULT_SETTINGS: MxSettings = {
  enableInEmbedMF: true,
  enableInLinkMF: false,
  allowEmbedMedia: false,
};

export default class MediaExtended extends Plugin {
  settings: MxSettings = DEFAULT_SETTINGS;
  // player = Plyr;

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

    if (this.settings.enableInEmbedMF){
      this.registerMarkdownPostProcessor(processInternalEmbeds);
    }
    if (this.settings.enableInLinkMF){
      this.registerMarkdownPostProcessor(processInternalLinks.bind(this));
    }
    if (this.settings.allowEmbedMedia){
      this.registerMarkdownPostProcessor(processExternalEmbeds);
    }

    // this.registerMarkdownPostProcessor(processVideoPlayer.bind(this));
  }

  onunload() {
    console.log("unloading media-extended");
  }
}

// function processVideoPlayer(el:HTMLElement, ctx:MarkdownPostProcessorContext) {
//    this.player = new Plyr("span.internal-embed > video")
// }

class MESettingTab extends PluginSettingTab {
  plugin: MediaExtended;

  constructor(app: App, plugin: MediaExtended) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    const options : option[] = [
      {
        k: "enableInEmbedMF",
        name: "Allow embeded video and audio fragments",
        desc: function(){
          const descEl = document.createDocumentFragment();
          descEl.appendText('If enabled, you can write ![[demo.mp4#t=10]] to embed the specific fragment of video/audio. ');
          descEl.appendChild(document.createElement('br'));
          descEl.appendText('Loop is also available by append #loop or #t=...&loop to the end of filename');
          descEl.appendChild(document.createElement('br'));
          descEl.appendText("Restart the app to take effects")
          return descEl;
          }()
      },
      {
        k: "enableInLinkMF",
        name: "Allow timestamps for video and audio",
        desc: function(){
          const descEl = document.createDocumentFragment();
          descEl.appendText("If enabled, you can write [[demo.mp4#t=10]] to create timestamp link to the video/audio. Click on the link would open the media file if it's not opened yet. ");
          descEl.appendChild(document.createElement('br'));
          descEl.appendText("PS: Only works in preview mode, hover preview on link is not available");
          descEl.appendChild(document.createElement('br'));
          descEl.appendText("Restart the app to take effects")
          return descEl;
          }()
      },
      {
        k: "allowEmbedMedia",
        name: "Allow standard image embed syntax to be used on video and audio",
        desc: function(){
          const descEl = document.createDocumentFragment();
          descEl.appendText('If enabled, you can write ![](link/to/demo.mp4) to embed video and audio.');
          descEl.appendChild(document.createElement('br'));
          descEl.appendText("Restart the app to take effects")
          return descEl;
          }()
      }
    ]

    for (const o of options) {
      setOption(o,this)
    }
  }
}

type option = { k: keyof MxSettings; name: string; desc: string|DocumentFragment; }

function setOption(
  { k, name, desc, }: option,
  tab:MESettingTab) {
    new Setting(tab.containerEl).setName(name).setDesc(desc)
      .addToggle(toggle => toggle
        .setValue(tab.plugin.settings[k])
        .onChange(async (value) => {
          console.log("changeTO:"+value);
          console.log("saved:"+tab.plugin.settings[k])
          tab.plugin.settings[k] = value;
          tab.plugin.saveData(tab.plugin.settings);
          tab.display();
        })
      );
}