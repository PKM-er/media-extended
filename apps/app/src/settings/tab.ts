import { pathToFileURL } from "url";
import type { PaneType } from "obsidian";
import {
  TextComponent,
  PluginSettingTab,
  Setting,
  Menu,
  Platform,
} from "obsidian";
import { showAtButton } from "@/lib/menu";
import { LoginModal } from "@/login/modal";
import type MxPlugin from "@/mx-main";
import "./style.global.less";
import { getDialog } from "@/web/session/utils";
import type { OpenLinkBehavior } from "./def";

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
        btn
          .setIcon("plus")
          .setTooltip("Add new protocol")
          .onClick(() => {
            const menu = new Menu().addItem((item) =>
              item
                .setIcon("link")
                .setTitle("Link mapping")
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
                  .setTitle("Folder mapping")
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
          btn
            .setIcon("trash")
            .setTooltip(`Remove ${protocol.getValue() || "empty"} protocol`)
            .onClick(() => {
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

  linkOpen() {
    const { containerEl: container } = this;
    new Setting(container)
      .setHeading()
      .setName("Link open")
      .setDesc("Configure how links to media are opened");
    type OpenLinkLabelled = PaneType | "replace" | "default";
    const options = {
      default: "Default obsidian behavior",
      replace: "In current pane",
      split: "New pane on the side",
      tab: "New tab",
      window: "New window",
    } satisfies Record<OpenLinkLabelled, string>;
    const toKeyDesc = (val: OpenLinkBehavior): string => {
      // Translates an event into the type of pane that should open.
      // Returns 'tab' if the modifier key Cmd/Ctrl is pressed OR
      // if this is a middle-click MouseEvent.
      // Returns 'split' if Cmd/Ctrl+Alt is pressed.
      // Returns 'window' if Cmd/Ctrl+Alt+Shift is pressed.
      switch (val) {
        case "split":
          if (Platform.isMacOS) return "click holding ⌘+⌥";
          return "click holding Ctrl+Alt";
        case "tab":
          if (Platform.isMacOS) return "click holding ⌘ or middle-click";
          return "middle-click or click holding Ctrl";
        case "window":
          if (Platform.isMacOS) return "click holding ⌘+⌥+⇧";
          return "click holding Ctrl+Alt+Shift";
        default:
          return "";
      }
    };
    const toLabel = (val: OpenLinkBehavior): OpenLinkLabelled => {
      if (val === null) return "default";
      if (val === false) return "replace";
      return val;
    };
    const fromLabel = (val: string): OpenLinkBehavior => {
      switch (val) {
        case "replace":
          return false;
        case "split":
        case "tab":
        case "window":
          return val as PaneType;
        // case "default":
        default:
          return null;
      }
    };

    new Setting(container)
      .setName("Default link click")
      .setDesc("Configure how links to media are opened")
      .addDropdown((d) =>
        d
          .addOptions(options)
          .setValue(toLabel(this.state.defaultMxLinkClick.click))
          .onChange((val) =>
            this.state.setDefaultMxLinkBehavior(fromLabel(val)),
          )
          .then(() =>
            this.sub((s, prev) => {
              if (s.defaultMxLinkClick.click === prev.defaultMxLinkClick.click)
                return;
              d.setValue(toLabel(s.defaultMxLinkClick.click));
            }),
          ),
      );

    const altCfg = new Setting(container)
      .setName("Altnernative behavior")
      .addDropdown((d) =>
        d
          .addOptions(options)
          .setValue(toLabel(this.state.defaultMxLinkClick.alt))
          .onChange((val) => this.state.setMxLinkAltBehavior(fromLabel(val)))
          .then(() =>
            this.sub((s, prev) => {
              if (s.defaultMxLinkClick.alt === prev.defaultMxLinkClick.alt)
                return;
              d.setValue(toLabel(s.defaultMxLinkClick.alt));
            }),
          ),
      );
    function onClickCfgUpdate(click: OpenLinkBehavior) {
      altCfg.settingEl.style.display = !click ? "none" : "";
      const keyDesc = toKeyDesc(click);
      altCfg.setDesc(
        "Configure link open behavior" + keyDesc ? ` when ${keyDesc}` : "",
      );
    }
    onClickCfgUpdate(this.state.defaultMxLinkClick.click);
    this.sub((s, prev) => {
      if (s.defaultMxLinkClick === prev.defaultMxLinkClick) return;
      onClickCfgUpdate(s.defaultMxLinkClick.click);
    });
  }

  playback() {
    const { containerEl: container } = this;

    new Setting(container).setHeading().setName("Playback");
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
    new Setting(container)
      .setName("Load strategy")
      .setDesc(
        createFragment((el) => {
          el.appendText("Configure when media embeds are loaded in the note");
          el.createEl("br");
          el.appendText(
            "Useful if you want lazy load media embeds in a note when there are many of them",
          );
        }),
      )
      .addDropdown((d) =>
        d
          .addOption("eager", "On note open")
          .addOption("play", "When interacted with")
          .setValue(this.state.loadStrategy)
          .onChange((val) =>
            this.state.setLoadStrategy(val as "play" | "eager"),
          ),
      );
  }

  noteTaking() {
    const { containerEl: container } = this;

    new Setting(container).setHeading().setName("Note taking");
    new Setting(container)
      .setDesc("Configure where timestamps and screenshots are inserted")
      .setName("Insert location")
      .addDropdown((d) =>
        d
          .addOption("before", "Latest content on top")
          .addOption("after", "Latest content at end")
          .setValue(this.state.insertBefore === true ? "before" : "after")
          .onChange((val) =>
            this.state.setInsertPosition(val as "before" | "after"),
          ),
      );
    new Setting(container)
      .setName("Timestamp template")
      .setDesc(
        createFragment((descEl) => {
          descEl.appendText("The template used to insert timestamps.");
          descEl.createEl("br");
          descEl.appendText("Supported placeholders: {{TIMESTAMP}}");
        }),
      )
      .addTextArea((text) => {
        text
          .setValue(this.state.timestampTemplate)
          .onChange((val) => this.state.setTemplate("timestamp", val));
        text.inputEl.rows = 5;
        text.inputEl.cols = 40;
      });
    new Setting(container)
      .setName("Screenshot linktext template")
      .setDesc(
        createFragment((descEl) => {
          descEl.appendText("The template used to create screenshot linktext.");
          descEl.createEl("br");
          descEl.appendText("Supported placeholders: {{DURATION}}, {{TITLE}}");
        }),
      )
      .addTextArea((text) => {
        text
          .setValue(this.state.screenshotEmbedTemplate)
          .onChange((val) => this.state.setTemplate("screenshotEmbed", val));
        text.inputEl.rows = 5;
        text.inputEl.cols = 40;
      });
    new Setting(container)
      .setName("Screenshot template")
      .setDesc(
        createFragment((descEl) => {
          descEl.appendText("The template used to insert screenshot.");
          descEl.createEl("br");
          descEl.appendText(
            "Supported placeholders: {{TIMESTAMP}}, {{SCREENSHOT}}",
          );
        }),
      )
      .addTextArea((text) => {
        text
          .setValue(this.state.screenshotTemplate)
          .onChange((val) => this.state.setTemplate("screenshot", val));
        text.inputEl.rows = 5;
        text.inputEl.cols = 40;
      });
    new Setting(container)
      .setName("Timestamp offset")
      .setDesc("Offset in seconds to add to the timestamp")
      .addSlider((slide) =>
        slide
          .setLimits(-10, 10, 0.01)
          .setValue(this.state.timestampOffset)
          .onChange(this.state.setTimestampOffset)
          .then((slide) => {
            this.sub((s, prev) => {
              if (s.timestampOffset === prev.timestampOffset) return;
              slide.setValue(s.timestampOffset);
            });
          }),
      )
      .addText((text) =>
        text
          .setValue(toStr(this.state.timestampOffset))
          .onChange(handleFloat(this.state.setTimestampOffset))
          .then((input) => {
            setLimits.call(input, -10, 10, 0.01);
            input.inputEl.type = "number";
            input.inputEl.style.textAlign = "center";
            this.sub((s, prev) => {
              if (s.timestampOffset === prev.timestampOffset) return;
              input.setValue(toStr(s.timestampOffset));
            });
          }),
      )
      .then((s) => s.controlEl.appendText("s"));
  }

  webpage() {
    if (!Platform.isDesktopApp) return;
    const { containerEl: container } = this;
    new Setting(container).setHeading().setName("Webpage");
    new Setting(container)
      .setName("Login")
      .setDesc(
        "If website requires login to access content or request login during playback, you can open a browser page here to login.",
      )
      .addButton((btn) =>
        btn
          .setCta()
          .setButtonText("Open broswer")
          .onClick(() => {
            new LoginModal(this.app).open();
          }),
      );
  }

  display() {
    const { containerEl: container } = this;
    container.empty();

    this.webpage();
    this.playback();
    this.noteTaking();
    this.linkOpen();
    this.protocol();
  }
}

function handleInt(handler: (val: number) => void) {
  return (val: string) => handler(parseInt(val, 10));
}
function handleFloat(handler: (val: number) => void) {
  return (val: string) => handler(parseFloat(val));
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
