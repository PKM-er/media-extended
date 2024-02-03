import type { TextComponent } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import type MxPlugin from "@/mx-main";

export class MxSettingTabs extends PluginSettingTab {
  plugin: MxPlugin;
  constructor(plugin: MxPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  get state() {
    return this.plugin.settings.getState();
  }
  get sub() {
    return this.plugin.settings.subscribe.bind(this.plugin.settings);
  }

  display() {
    const { containerEl: container } = this;
    container.empty();
    new Setting(container)
      .setName("Default volume")
      .setDesc("The default volume for media files")
      .addSlider((slide) =>
        slide
          .setLimits(0, 100, 1)
          .setValue(this.state.defaultVolume)
          .onChange(this.state.setDefaultVolume)
          .then((slide) => {
            this.sub((s, prev) => {
              if (s.defaultVolume === prev.defaultVolume) return;
              slide.setValue(s.defaultVolume);
            });
          }),
      )
      .addText((text) =>
        text
          .setValue(toStr(this.state.defaultVolume))
          .onChange(handleInt(this.state.setDefaultVolume))
          .then((input) => {
            setLimits.call(input, 0, 100, 1);
            input.inputEl.type = "number";
            input.inputEl.style.textAlign = "center";
            this.sub((s, prev) => {
              if (s.defaultVolume === prev.defaultVolume) return;
              input.setValue(toStr(s.defaultVolume));
            });
          }),
      )
      .then((s) => s.controlEl.appendText("%"));
  }
}

function handleInt(handler: (val: number) => void) {
  return (val: string) => handler(parseInt(val, 10));
}
function toStr(val: number) {
  return val.toString();
}
function setLimits(
  this: TextComponent,
  min: number,
  max: number,
  step: number,
) {
  this.inputEl.min = min.toString();
  this.inputEl.max = max.toString();
  this.inputEl.step = step.toString();
  return this;
}
