import { BrowserWindow, getCurrentWindow } from "@electron/remote";
import { Modal, Notice } from "obsidian";

const openLoginWindow = (url: string) => {
  const currWin = getCurrentWindow();
  const login = new BrowserWindow({
    show: true,
    parent: currWin,
    fullscreen: false,
    width: 1280,
    height: 720,
    minWidth: 200,
    minHeight: 150,
    title: "Login",
    webPreferences: {
      sandbox: true,
      webSecurity: true,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      plugins: false,
      experimentalFeatures: false,
      webviewTag: false,
    },
  });
  login.loadURL(url);
  login.webContents.setWindowOpenHandler((details) => {
    login.loadURL(details.url);
    return { action: "deny" };
  });
  return login;
};

export default class LoginModal extends Modal {
  inputEl: HTMLInputElement;
  constructor() {
    super(app);
    this.titleEl.setText("Login your account");
    this.contentEl.createDiv({
      text: "Enter the website you want to login to, and continue login in popup window",
    });
    this.contentEl.createDiv({
      text: "You can close the window when you finish login",
    });
    this.contentEl.createEl("label", { cls: "input-label", text: "URL" });
    this.inputEl = this.contentEl.createEl("input", { type: "url" });
    this.inputEl.required = true;
    this.modalEl.createDiv({ cls: "modal-button-container" }, (div) => {
      div.createEl("button", { cls: "mod-cta", text: "Open" }, (el) =>
        el.addEventListener("click", this.confirm.bind(this)),
      );
      div.createEl("button", { text: "Cancel" }, (el) =>
        el.onClickEvent(() => this.close()),
      );
    });
  }
  confirm() {
    if (this.inputEl.validity.valid) {
      try {
        const win = openLoginWindow(this.inputEl.value);
        win.once("close", () => this.close());
        console.log(win.webContents.getURL());
      } catch (error) {
        new Notice(
          "Failed to open URL " +
            this.inputEl.value +
            ": " +
            (error instanceof Error
              ? error.message
              : (error as any).toString?.()),
        );
      }
    } else {
      new Notice("Invalid URL, please check again: " + this.inputEl.value);
    }
  }
}
