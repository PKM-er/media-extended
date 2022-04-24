import MediaExtended from "@plugin";
import { Modal, Notice, Platform } from "obsidian";

import { openMediaLink } from "./open-media";

export default class PromptModal extends Modal {
  plugin: MediaExtended;
  constructor(plugin: MediaExtended) {
    super(plugin.app);
    this.plugin = plugin;
  }
  inputEl: HTMLInputElement | null = null;

  async confirm() {
    if (!this.inputEl) {
      throw new Error("inputEl is null");
    } else if (await openMediaLink(this.inputEl.value, true)) {
      this.close();
    } else {
      new Notice("Link not supported");
    }
  }

  onOpen() {
    super.onOpen();
    this.scope.register([], "Enter", (e) => {
      if (!e.isComposing) {
        this.confirm();
        return false;
      }
    });
    let { contentEl, titleEl, modalEl } = this;

    titleEl.setText("Enter Link to Media");
    const input = contentEl.createEl("input", { type: "text" }, (el) => {
      el.style.width = "100%";
    });
    this.inputEl = input;
    modalEl.createDiv({ cls: "modal-button-container" }, (div) => {
      div.createEl("button", { cls: "mod-cta", text: "Open" }, (el) =>
        el.addEventListener("click", this.confirm.bind(this)),
      );
      div.createEl("button", { text: "Cancel" }, (el) =>
        el.onClickEvent(() => this.close()),
      );
    });
    if (Platform.isSafari) {
      const temp = document.body.createEl("input", { type: "text" });
      temp.style.position = "absolute";
      temp.style.top = "0";
      temp.style.opacity = "0";
      temp.style.zIndex = "-9999";
      temp.focus();
      setTimeout(() => {
        temp.detach();
        input.focus();
      }, 300);
    } else input.focus();
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
