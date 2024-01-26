import type { App } from "obsidian";
import { Modal, Notice } from "obsidian";

export class PlaybackSpeedPrompt extends Modal {
  static run(): Promise<number | null> {
    return new Promise((resolve) => {
      const modal = new PlaybackSpeedPrompt(
        // eslint-disable-next-line deprecation/deprecation
        app,
        (val) => resolve(Number(val)),
        () => resolve(null),
      );
      modal.open();
    });
  }

  constructor(
    app: App,
    public onSubmit: (result: string) => void,
    public onExit: () => void,
  ) {
    super(app);
    this.containerEl.addClass("mx-playback-prompt");
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl, titleEl } = this;

    titleEl.setText("Playback Speed");
    const form = contentEl.createEl("form", {}, (formEl) => {
      formEl.createEl("input", {
        type: "number",
        placeholder: "Enter a number between 0 and 10",
        attr: {
          min: 0.1,
          max: 10,
          step: 0.1,
          width: 100,
          required: true,
          name: "playback-speed",
        },
      });
      formEl.createEl("button", {
        attr: { type: "submit" },
        text: "Submit",
      });
    });
    form.oninvalid = (evt) => {
      evt.preventDefault();
      new Notice("Invalid playback rate");
    };
    form.onsubmit = (evt) => {
      evt.preventDefault();
      const formData = new FormData(form);
      this.onSubmit(formData.get("playback-speed")!.toString());
      this.close();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    this.onExit();
  }
}
