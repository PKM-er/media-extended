import type { App } from "obsidian";
import {
  ButtonComponent,
  Modal,
  Notice,
  TextComponent,
  Menu,
  DropdownComponent,
} from "obsidian";
import "./modal.global.less";
import {
  mediaHostDisplayName,
  mediaHostUrl,
  noGeneric,
} from "@/info/supported";
import type { SupportedMediaHost } from "@/info/supported";
import { showAtButton } from "@/lib/menu";
import { getPartition } from "@/lib/remote-player/const";
import { getSession, getWebContents } from "@/lib/require";

export class LoginModal extends Modal {
  navEl = this.contentEl.insertAdjacentElement(
    "beforebegin",
    createDiv({
      cls: "mx-login-nav",
    }),
  )! as HTMLDivElement;
  constructor(app: App) {
    super(app);
    this.containerEl.addClasses(["mx-login-modal"]);
    this.titleEl.style.display = "none";
    this.buildWelcome();
  }
  get partition() {
    return getPartition(this.app.appId);
  }

  webview = createEl("webview" as "iframe", {
    attr: {
      partition: this.partition as string,
      allowpopups: "",
    },
  }) as unknown as Electron.WebviewTag;

  backButton = new ButtonComponent(this.navEl)
    .setIcon("arrow-left")
    .setTooltip("Back")
    .setClass("mx-login-back")
    .setDisabled(true)
    .onClick(() => {
      try {
        this.webview.goBack();
      } catch (e) {
        new Notice("Failed to go back, see console for details");
        console.error("err go back", e);
      }
    });
  forwardButton = new ButtonComponent(this.navEl)
    .setIcon("arrow-right")
    .setTooltip("Forward")
    .setClass("mx-login-forward")
    .setDisabled(true)
    .onClick(() => {
      try {
        this.webview.goForward();
      } catch (e) {
        new Notice("Failed to go forward, see console for details");
        console.error("err go forward", e);
      }
    });
  refreshButton = new ButtonComponent(this.navEl)
    .setIcon("rotate-ccw")
    .setTooltip("Refresh")
    .setClass("mx-login-refresh")
    .setDisabled(true)
    .onClick(() => {
      try {
        this.webview.reload();
      } catch (e) {
        new Notice("Failed to refresh, see console for details");
        console.error("err refresh", e);
      }
    });

  addressBarForm = this.navEl.createEl("form");
  addressBar = new TextComponent(this.addressBarForm).then((el) => {
    el.inputEl.type = "url";
    el.inputEl.placeholder = "https://example.com";
    el.inputEl.classList.add("mx-login-address");
  });
  addressSubmit = new ButtonComponent(this.addressBarForm)
    .setIcon("arrow-right-circle")
    .then((el) => (el.buttonEl.type = "submit"));
  moreOptionsButton = new ButtonComponent(this.navEl)
    .setIcon("more-horizontal")
    .setTooltip("More options")
    .setClass("mx-login-more")
    .onClick((e) => {
      const menu = new Menu();
      this.onMoreOptions(menu);
      showAtButton(e, menu);
    });

  buildWelcome() {
    this.contentEl.empty();
    this.contentEl.createEl("h1").setText("Login");
    const page = this.contentEl.createEl("main");

    page
      .createEl("p")
      .setText(
        "You can login to sites, change preferences and more, just as you would in a browser.",
      );
    page.createEl("p").setText("To open a website, you can:");

    const methods = page.createEl("ul");
    methods.createEl("li").setText("Enter the site address in the address bar");
    const selectFrom = methods.createEl("li");
    selectFrom.setText("Select from a list of ");

    new DropdownComponent(selectFrom)
      .addOptions({
        ...noGeneric(mediaHostDisplayName),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".": "supported websites...",
      })
      .setValue(".")
      .onChange((val) => {
        if (val in mediaHostUrl) {
          this.setUrl(mediaHostUrl[val as SupportedMediaHost]);
        }
      });
  }

  getSession() {
    return getSession(this.app.appId);
  }

  onMoreOptions(menu: Menu) {
    menu.addItem((item) =>
      item
        .setTitle("Clear cache")
        .setSection("clear")
        .setIcon("trash")
        .onClick(async () => {
          const yes = window.confirm(
            "Are you sure you want to clear the website cache? All login sessions and preferences will be lost.",
          );
          if (!yes) return;
          try {
            await this.getSession()?.clearCache();
            new Notice("Cache cleared");
          } catch (e) {
            new Notice("Failed to clear cache, see console for details");
            console.error("err clear cache", e);
          }
        }),
    );
  }

  setUrl(url: string) {
    this.initWebview();
    this.webview.src = url;
    this.addressBar.setValue(url);
  }

  callbacks: (() => void)[] = [];
  register(cb: () => void) {
    this.callbacks.push(cb);
  }
  registerWebviewEvent(evt: string, cb: () => void) {
    this.webview.addEventListener(evt, cb);
    this.register(() => this.webview.removeEventListener(evt, cb));
  }
  onClose(): void {
    for (const cb of this.callbacks) {
      cb();
    }
    this.containerEl.empty();
  }

  initWebview() {
    if (this.webview.isConnected) return;
    this.registerWebviewEvent("will-navigate", () => {
      this.addressBar.setValue(this.webview.getURL());
    });
    this.contentEl.empty();
    this.contentEl.appendChild(this.webview);
    this.backButton.setDisabled(false);
    this.forwardButton.setDisabled(false);
    this.refreshButton.setDisabled(false);
    this.registerWebviewEvent("dom-ready", () => {
      if (this.handledWebcontents.has(this.webview.getWebContentsId())) return;
      const webContentId = this.webview.getWebContentsId();
      this.handledWebcontents.add(webContentId);
      const webContents = getWebContents(webContentId);
      webContents?.setWindowOpenHandler(({ url, disposition }) => {
        if (
          disposition === "new-window" ||
          disposition === "foreground-tab" ||
          disposition === "default"
        ) {
          this.setUrl(url);
        }
        return { action: "deny" };
      });
    });
  }

  handledWebcontents: Set<number> = new Set();

  onOpen(): void {
    this.addressBarForm.onsubmit = (e) => {
      e.preventDefault();
      const url = this.addressBar.getValue();
      if (!url) return;
      this.setUrl(url);
    };
  }
}
