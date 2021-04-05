import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { processInternalEmbeds, processExternalEmbeds } from "./processor";
// import Plyr from "plyr"

interface MxSettings {
  enableMF: boolean;
  allowEmbedMedia: boolean;
}

const DEFAULT_SETTINGS: MxSettings = {
  enableMF: true,
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

    if (this.settings.enableMF){
      this.registerMarkdownPostProcessor(processInternalEmbeds.bind(this));
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
        k: "enableMF",
        name: "Allow Timestamps for embeded video and audio",
        desc: function(){
          const descEl = document.createDocumentFragment();
          descEl.appendText('If enabled, you can write ![[demo.mp4#t=10]] to start playing video/audio at that specific time. ');
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