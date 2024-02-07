import { pathToFileURL } from "url";
import {
  TextComponent,
  PluginSettingTab,
  Setting,
  Menu,
  Platform,
} from "obsidian";
import { showAtButton } from "@/lib/menu";
import type MxPlugin from "@/mx-main";
import "./style.global.less";
import { getDialog } from "@/web/session/utils";

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

  protocol() {
    new Setting(this.containerEl)
      .setHeading()
      .setName("Protocols")
      .setDesc("Create custom protocols that resolve link per device");
    const container = this.containerEl.createDiv({
      cls: "mx-protocol-container",
    });
    new Setting(container)
      .setHeading()
      .setName("This device")
      .addText((text) =>
        text
          .setPlaceholder(this.state.getDeviceNameWithDefault())
          .setValue(this.state.getDeviceName() ?? "")
          .onChange((val) => this.state.setDeviceName(val)),
      )
      .addExtraButton((btn) =>
        btn.setIcon("plus").onClick(() => {
          const menu = new Menu().addItem((item) =>
            item
              .setIcon("link")
              .setTitle("Add link")
              .onClick(() => {
                const setting = buildItem({
                  protocol: "",
                  replace: "https://",
                });
                list.insertAdjacentElement("afterbegin", setting.settingEl);
              }),
          );
          if (Platform.isDesktopApp) {
            menu.addItem((item) =>
              item
                .setIcon("folder")
                .setTitle("Add folder")
                .onClick(async () => {
                  const folder = (
                    await getDialog().showOpenDialog({
                      title: "Pick a folder",
                      message: "Pick a folder to resolve media files from",
                      buttonLabel: "Pick",
                      properties: ["openDirectory"],
                    })
                  ).filePaths[0];
                  if (!folder) return;
                  const setting = buildItem({
                    protocol: "",
                    replace: pathToFileURL(folder).href,
                  });
                  list.insertAdjacentElement("afterbegin", setting.settingEl);
                }),
            );
          }
          showAtButton(btn.extraSettingsEl, menu);
        }),
      );
    const list = container.createDiv({ cls: "mx-protocol-list" });
    const buildItem = (p: {
      protocol: string;
      replace: string;
      devices?: (string | null)[];
    }) =>
      new Setting(list).then((item) => {
        let prevProtocol = p.protocol;
        const protocol = new TextComponent(item.controlEl)
          .setPlaceholder("Protocol name")
          .setValue(prevProtocol)
          .onChange((protocol) => {
            if (!protocol) return;
            const prev = prevProtocol;
            prevProtocol = protocol;
            this.state.removeUrlMapping(prev);
            const replaceVal = replace.getValue();
            if (!replaceVal) return;
            this.state.setUrlMapping(protocol, replaceVal);
          });

        let placeholder = "Target URL prefix";
        if (p.devices) {
          placeholder = "Configured in ";
          const withName = p.devices
            .filter((x): x is string => !!x)
            .slice(0, 2);
          if (withName.length > 0) {
            placeholder += withName.join(", ");
            if (withName.length < p.devices.length) {
              placeholder += ", ...";
            }
          } else {
            placeholder += "unknown device";
            if (p.devices.length > 1) placeholder += "s";
          }
        }
        const replace = new TextComponent(item.controlEl)
          .setPlaceholder(placeholder)
          .setValue(p.replace)
          .onChange((replace) => {
            if (!protocol.getValue()) return;
            this.state.setUrlMapping(protocol.getValue(), replace);
          });
        protocol.inputEl.addClass("mx-protocol-input");
        replace.inputEl.addClass("mx-replace-input");
        item.addExtraButton((btn) =>
          btn.setIcon("trash").onClick(() => {
            this.state.removeUrlMapping(protocol.getValue());
            item.settingEl.remove();
          }),
        );
      });

    const data = this.state.getUrlMappingData();
    const protocols = [...new Set(data.map((p) => p.protocol))].sort();

    protocols.forEach((protocol) => {
      buildItem({
        protocol,
        devices: data
          .filter(
            (p) => p.protocol === protocol && p.appId !== this.plugin.app.appId,
          )
          .map(
            (p) =>
              this.state.devices.find((d) => d.appId === p.appId)?.name ?? null,
          ),
        replace: this.state.getUrlMapping(protocol) ?? "",
      });
    });
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

    this.protocol();
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
