import { getMediaType } from "@base/media-type";
import parseURL from "@base/url-parse";
import { stripHash } from "@misc";
import type MediaExtended from "@plugin";
import { around } from "monkey-around";
import {
  App,
  Component,
  Menu,
  Modal,
  Notice,
  ViewStateResult,
  WorkspaceLeaf,
} from "obsidian";

import { MEDIA_VIEW_TYPE, MediaUrlState } from "../media-view";

interface EmptyView extends Component {
  /**
   * @public
   */
  app: App;
  /**
   * @public
   */
  icon: string;
  /**
   * @public
   */
  navigation: boolean;
  /**
   * @public
   */
  leaf: WorkspaceLeaf;
  /**
   * @public
   */
  containerEl: HTMLElement;
  actionListEl: HTMLElement;

  /**
   * @public
   */
  onOpen(): Promise<void>;
  /**
   * @public
   */
  onClose(): Promise<void>;
  /**
   * @public
   */
  getViewType(): string;
  /**
   * @public
   */
  getState(): any;
  /**
   * @public
   */
  setState(state: any, result: ViewStateResult): Promise<void>;
}

declare module "obsidian" {
  interface Commands {
    executeCommandById(id: string, evt: Event): boolean;
  }
  interface App {
    commands: Commands;
  }
}

const commandId = "open-media-link";

export const handleOpenMediaLink = (evt: Event) => {
  app.commands.executeCommandById("media-extended:" + commandId, evt);
};

const registerOpenMediaLink = (plugin: MediaExtended) => {
  plugin.addCommand({
    id: commandId,
    name: "Open Media from Link",
    callback: () => {
      new PromptModal(plugin).open();
    },
  });
  // patchEmptyView
  const emptyViewProto = new (WorkspaceLeaf as any)(plugin.app).view.constructor
    .prototype as EmptyView;

  plugin.register(
    around(emptyViewProto, {
      onOpen: (next) =>
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        async function (this: EmptyView) {
          await next.call(this);
          const item = this.actionListEl.createDiv({
            cls: "empty-state-action",
            text: "Open Media Link",
          });
          item.addEventListener("click", handleOpenMediaLink);
        },
    }),
  );

  // command to open in external browser

  const openExternal = (menu: Menu, url: string) => {
    vaildateMediaURL(url, (url, hash) => {
      menu.addItem((item) =>
        item
          .setIcon("open-elsewhere-glyph")
          .setTitle("Open in External Browser")
          .onClick(() => window.open(url, "_blank")),
      );
    });
  };
  plugin.registerEvent(plugin.app.workspace.on("url-menu", openExternal));

  // add default media link menu items
  plugin.registerEvent(
    plugin.app.workspace.on("media-url-menu", (menu, url, source) => {
      if (source === "pane-more-options") {
        openExternal(menu, url);
      }
    }),
  );
};
export default registerOpenMediaLink;

const open = (url: string, hash: string) => {
  const state: MediaUrlState = { url, file: null, fragment: null };
  const leaf = app.workspace.getLeaf();
  console.log("openMediaLink", url, hash);
  leaf.setViewState(
    { type: MEDIA_VIEW_TYPE, active: true, state },
    { subpath: hash },
  );
};
/**
 * @param url can be url contains hash
 */
export const openMediaLink = (url: string): boolean =>
  vaildateMediaURL(url, open);

const vaildateMediaURL = (
  _url: string,
  onVaild?: (url: string, hash: string) => any,
): boolean => {
  let result;
  if (getMediaType(_url)) {
    const [url, hash] = stripHash(_url);
    onVaild?.(url, hash);
  } else if ((result = parseURL(_url))) {
    onVaild?.(result.url, result.hash);
  } else return false;

  return true;
};

class PromptModal extends Modal {
  plugin: MediaExtended;
  constructor(plugin: MediaExtended) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onOpen() {
    let { contentEl, titleEl, modalEl } = this;

    titleEl.setText("Enter Link to Media");
    const input = contentEl.createEl("input", { type: "text" }, (el) => {
      el.style.width = "100%";
      el.focus();
    });
    modalEl.createDiv({ cls: "modal-button-container" }, (div) => {
      div.createEl("button", { cls: "mod-cta", text: "Open" }, (el) =>
        el.addEventListener("click", async () => {
          if (openMediaLink(input.value)) {
            this.close();
          } else {
            new Notice("Link not supported");
          }
        }),
      );
      div.createEl("button", { text: "Cancel" }, (el) =>
        el.onClickEvent(() => this.close()),
      );
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
