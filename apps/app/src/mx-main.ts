import "./style.css";
import { App, Modal, Plugin } from "obsidian";
import ReactDOM from "react-dom";
import { render } from "./comp";

export default class MxPlugin extends Plugin {
  async onload() {
    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: "open-sample-modal-simple",
      name: "Open sample modal (simple)",
      callback: () => {
        new SampleModal(this.app).open();
      },
    });
  }

  onunload() {}
}

class SampleModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("mx");
    this.onClose = render(contentEl);
  }
}
