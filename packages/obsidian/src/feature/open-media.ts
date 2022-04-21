import { vaildateMediaURL } from "@base/url-parse";
import type MediaExtended from "@plugin";
import { around } from "monkey-around";
import {
  App,
  Component,
  Menu,
  Modal,
  Notice,
  TFile,
  ViewState,
  ViewStateResult,
  WorkspaceLeaf,
} from "obsidian";

import {
  MEDIA_VIEW_TYPE,
  MediaFileState,
  MediaUrlState,
  MediaView,
} from "../media-view";
import { getMostRecentViewOfType } from "../misc";
import {
  createLeafBySplit,
  findMediaViewByFile,
  findMediaViewByUrl,
} from "./smart-view-open";

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

const getViewState = (type: "url" | "file", link: string) => {
  let state: MediaUrlState | MediaFileState;
  if (type === "url") {
    state = { url: link, file: null, fragment: null };
  } else {
    state = { file: link, fragment: null };
  }
  return { type: MEDIA_VIEW_TYPE, active: true, state };
};
const getEphemeralState = (hash: string) => ({ subpath: hash });

export const openMediaLink = (url: string, newLeaf = false) =>
  vaildateMediaURL(url, (url, hash) => {
    const viewState = getViewState("url", url),
      findMediaView = () => findMediaViewByUrl(url);
    openMediaView(viewState, hash, findMediaView, newLeaf);
  });

export const openMediaLinkInHoverEditor = (
  url: string,
  initiatingEl: HTMLElement,
  event: MouseEvent,
) => {
  let hoverEditor = app.plugins.plugins["obsidian-hover-editor"];
  if (!hoverEditor) return false;
  return vaildateMediaURL(url, (url, hash) => {
    const viewState = getViewState("url", url),
      eState = getEphemeralState(hash);
    app.workspace.trigger("hover-link", { event } as any);
    const leaf = hoverEditor.spawnPopover(
      initiatingEl,
      undefined,
      false,
    ) as WorkspaceLeaf;
    leaf.setViewState(viewState, eState);
  });
};

const openMediaView = (
  viewState: ViewState,
  hash: string,
  findMediaView: () => MediaView | null,
  newLeaf: boolean,
) => {
  let view: MediaView | null;
  const setViewState = (leaf: WorkspaceLeaf) =>
    leaf.setViewState(viewState, getEphemeralState(hash));
  if (newLeaf) {
    const leaf = createLeafBySplit(app.workspace.getLeaf());
    leaf.setViewState(viewState);
    setViewState(leaf);
  } else if ((view = findMediaView())) {
    view.setHash(hash);
  } else if ((view = getMostRecentViewOfType(MediaView))) {
    setViewState(view.leaf);
  } else {
    setViewState(app.workspace.getLeaf());
  }
  return true;
};

export const openMediaFile = (
  file: TFile,
  hash: string,
  newLeaf = false,
): boolean => {
  if (app.viewRegistry.getTypeByExtension(file.extension) !== MEDIA_VIEW_TYPE)
    return false;
  const viewState = getViewState("file", file.path),
    findMediaView = () => findMediaViewByFile(file);
  return openMediaView(viewState, hash, findMediaView, newLeaf);
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
