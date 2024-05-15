/* eslint-disable @typescript-eslint/naming-convention */
import { pathToFileURL } from "url";
import iso from "iso-639-1";
import type { PaneType } from "obsidian";
import {
  TextComponent,
  PluginSettingTab,
  Setting,
  Menu,
  Platform,
} from "obsidian";
import { getGroupedLangExtra } from "@/lib/lang/lang";
import { showAtButton } from "@/lib/menu";
import { getDialog } from "@/lib/require";
import { LoginModal } from "@/login/modal";
import type MxPlugin from "@/mx-main";
import "./style.global.less";
import type { BilibiliQuality } from "@/web/session/bilibili";
import { bilibiliQualityLabels } from "@/web/session/bilibili";
import type { MxSettings, OpenLinkBehavior } from "./def";

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
    type OpenLinkLabelled =
      | PaneType
      | "split-horizontal"
      | "replace"
      | "default";
    const options = {
      default: "Default obsidian behavior",
      replace: "In current pane",
      split: "New pane on the right",
      "split-horizontal": "New pane on the bottom",
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
        case "split-horizontal":
          if (Platform.isMacOS) return "click holding ⌘+⌥";
          return "click holding Ctrl+Alt";
        case "window":
          if (Platform.isMacOS) return "click holding ⌘+⌥+⇧";
          return "click holding Ctrl+Alt+Shift";
        case "tab":
        default:
          if (Platform.isMacOS) return "click holding ⌘ or middle-click";
          return "middle-click or click holding Ctrl";
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
        case "split-horizontal":
          return "split-horizontal";
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
      // altCfg.settingEl.style.display = !click ? "none" : "";
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

  subtitle() {
    const { containerEl: container } = this;
    new Setting(container)
      .setName("Enable subtitle by default")
      .setDesc("Toggle subtitle on by default when available")
      .addToggle((toggle) =>
        toggle
          .setValue(this.state.enableSubtitle)
          .onChange(this.state.setEnableSubtitle),
      );
    const fallback = "_follow_";
    const extra = getGroupedLangExtra();
    const locales = Object.fromEntries(
      iso.getAllCodes().flatMap((lang) => {
        if (!extra.has(lang)) return [[lang, iso.getNativeName(lang)]];
        return [...extra.get(lang)!.values()];
      }),
    );
    new Setting(container)
      .setName("Default locale")
      .setDesc("The default locale for subtitles")
      .addDropdown((dropdown) =>
        dropdown
          .addOption(fallback, "Follow obsidian locale")
          .addOptions(locales)
          .setValue(this.state.defaultLanguage ?? fallback)
          .onChange((val) =>
            this.state.setDefaultLanguage(val === fallback ? null : val),
          ),
      );
    new Setting(container)
      .setName("Speed step")
      .setDesc(
        "Configure the step for command to slightly increasing or decreasing playback speed",
      )
      .addSlider((slide) =>
        slide
          .setLimits(0.01, 2, 0.01)
          .setValue(this.state.speedStep)
          .onChange(this.state.setSpeedStep)
          .then((slide) => {
            this.sub((s, prev) => {
              if (s.speedStep === prev.speedStep) return;
              slide.setValue(s.speedStep);
            });
          }),
      )
      .addText((text) =>
        text
          .setValue(toStr(this.state.speedStep))
          .onChange(handleFloat(this.state.setSpeedStep))
          .then((input) => {
            setLimits.call(input, 0.01, 2, 0.01);
            input.inputEl.type = "number";
            input.inputEl.style.textAlign = "center";
            this.sub((s, prev) => {
              if (s.speedStep === prev.speedStep) return;
              input.setValue(toStr(s.speedStep));
            });
          }),
      )
      .then((s) => s.controlEl.appendText("x"));

    new Setting(container)
      .setName("Default location for downloaded subtitle")
      .setDesc("Where subtitles from website are placed.")
      .addDropdown((d) =>
        d
          .addOptions({
            default: "In attachment folder",
            specific: "In the folder specified below",
          })
          .onChange((d) => {
            this.state.setSubtitleFolder(d === "specific" ? "" : null);
          }),
      );

    new Setting(container)
      .setName("Subtitle folder path")
      .setDesc("Place newly created subtitle files in this folder.")
      .addText((t) =>
        t
          .setPlaceholder("Example: folder 1/folder")
          .setValue(this.state.subtitleFolderPath ?? "")
          .onChange(this.state.setSubtitleFolder),
      )
      .then((setting) => {
        setting.settingEl.style.display =
          this.state.subtitleFolderPath !== undefined ? "" : "none";
        this.sub((s, prev) => {
          if (typeof s.subtitleFolderPath === typeof prev.subtitleFolderPath)
            return;
          setting.settingEl.style.display =
            s.subtitleFolderPath !== undefined ? "" : "none";
        });
      });
  }

  timestamp() {
    const { containerEl: container } = this;

    new Setting(container).setHeading().setName("Timestamp");

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

  screenshot() {
    const { containerEl: container } = this;

    new Setting(container).setHeading().setName("Screenshot");

    new Setting(container)
      .setName("Screenshot linktext template")
      .setDesc(
        createFragment((descEl) => {
          descEl.appendText("The template used to create screenshot linktext.");
          descEl.createEl("br");
          descEl.appendText("Supported placeholders: {{DURATION}}, {{TITLE}}");
          descEl.createEl("br");
          descEl.appendText("Remove `|50` suffix to embed image in full size");
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
          descEl.appendText("Supported placeholders: ");
          descEl.createEl("ul", {}, (ul) => {
            ul.createEl("li").appendText("{{TIMESTAMP}} - timestamp link");
            ul.createEl("li", {}, (li) => {
              li.appendText("{{SCREENSHOT}} - link to screenshot");
              li.createEl("br");
              li.appendText("add `!` prefix to insert as image embed");
            });
          });
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
      .setName("Screenshot format")
      .setDesc(
        createFragment((frag) => {
          frag.appendText("The format to use when taking screenshots");
          frag.createEl("br");
          frag.appendText(
            "Note that the webp format falls back to jpeg in iOS or iPadOS",
          );
        }),
      )
      .addDropdown((d) =>
        d
          .addOptions({
            "image/png": "PNG",
            "image/jpeg": "JPEG",
            "image/webp": "WEBP",
          })
          .setValue(this.state.screenshotFormat)
          .onChange((val) =>
            this.state.setScreenshotFormat(
              val as "image/png" | "image/jpeg" | "image/webp",
            ),
          ),
      );

    new Setting(container)
      .setName("Default location for new screenshots")
      .setDesc("Where newly added attachments are placed.")
      .addDropdown((d) =>
        d
          .addOptions({
            default: "In attachment folder",
            specific: "In the folder specified below",
          })
          .onChange((d) => {
            this.state.setScreenshotFolder(d === "specific" ? "" : null);
          }),
      );

    new Setting(container)
      .setName("Attachment folder path")
      .setDesc("Place newly created screenshot files in this folder.")
      .addText((t) =>
        t
          .setPlaceholder("Example: folder 1/folder")
          .setValue(this.state.screenshotFolderPath ?? "")
          .onChange(this.state.setScreenshotFolder),
      )
      .then((setting) => {
        setting.settingEl.style.display =
          this.state.screenshotFolderPath !== undefined ? "" : "none";
        this.sub((s, prev) => {
          if (
            typeof s.screenshotFolderPath === typeof prev.screenshotFolderPath
          )
            return;
          setting.settingEl.style.display =
            s.screenshotFolderPath !== undefined ? "" : "none";
        });
      });

    const qualVal = (state: MxSettings) =>
      state.screenshotFormat === "image/webp" ? 0.8 : 0.92;
    new Setting(container)
      .setName("Screenshot quality")
      .setDesc("Quality of the screenshot")
      .addText((text) =>
        text
          .setValue(this.state.screenshotQuality?.toString() ?? "")
          .setPlaceholder(qualVal(this.state).toString())
          .onChange(handleFloat(this.state.setScreenshotQuality))
          .then((input) => {
            setLimits.call(input, 0, 1, 0.01);
            input.inputEl.type = "number";
            input.inputEl.style.textAlign = "center";
            this.sub((s, prev) => {
              if (s.screenshotFormat !== prev.screenshotFormat) {
                input.setPlaceholder(qualVal(this.state).toString());
              }
              if (s.screenshotQuality !== prev.screenshotQuality) {
                input.setValue(s.screenshotQuality?.toString() ?? "");
              }
            });
          }),
      )
      .addButton((btn) =>
        btn
          .setTooltip("Reset to default")
          .setIcon("reset")
          .onClick(() => {
            this.state.setScreenshotQuality(null);
          })
          .setDisabled(this.state.screenshotQuality === null)
          .then(() => {
            this.sub((s, prev) => {
              if (s.screenshotQuality !== prev.screenshotQuality) {
                btn.setDisabled(s.screenshotQuality === null);
              }
            });
          }),
      )
      .then((entry) => {
        this.sub((s, prev) => {
          if (s.screenshotFormat === prev.screenshotFormat) return;
          entry.settingEl.style.display =
            s.screenshotFormat === "image/png" ? "none" : "";
        });
      });
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

    this.timestamp();
    this.screenshot();
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

  bilibili() {
    const { containerEl: container } = this;
    new Setting(container).setHeading().setName("Bilibili");
    new Setting(container)
      .setName("Default quality")
      .setDesc(
        createFragment((e) => {
          e.appendText(
            "The default quality for bilibili videos, will fallback to closest quality if not available",
          );
          e.createEl("br");
          e.appendText("Only new videos will use this quality");
        }),
      )
      .addDropdown((d) =>
        d
          .addOptions(bilibiliQualityLabels)
          .setValue(this.state.biliDefaultQuality.toString())
          .onChange(
            handleInt((val) =>
              this.state.setBiliDefaultQuality(val as BilibiliQuality),
            ),
          ),
      );
  }

  display() {
    const { containerEl: container } = this;
    container.empty();

    this.webpage();
    this.playback();
    this.subtitle();
    this.noteTaking();
    this.linkOpen();
    this.protocol();
    this.bilibili();
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
