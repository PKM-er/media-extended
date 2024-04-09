import type { Menu, ViewStateResult, WorkspaceLeaf } from "obsidian";
import { ItemView } from "obsidian";
import ReactDOM from "react-dom/client";
import LineView from "@/components/transcript/line";
import { isFileMediaInfo } from "@/info/media-info";
import { MediaHost, mediaHostDisplayName } from "@/info/supported";
import type { PaneMenuSource } from "@/lib/menu";
import { updateTitle } from "@/lib/view-title";
import { compare } from "@/media-note/note-index/def";
import type MxPlugin from "@/mx-main";
import { transcriptViewType } from "./const";
import { createTranscriptViewStore, TranscriptViewContext } from "./context";

interface WebpageTranscriptViewState {
  source: string;
  id: string;
}

export class WebpageTranscriptView extends ItemView {
  static register(plugin: MxPlugin) {
    plugin.registerView(
      transcriptViewType.webpage,
      (leaf) => new WebpageTranscriptView(leaf, plugin),
    );
  }

  store = createTranscriptViewStore();
  root: ReactDOM.Root | null = null;
  navigation = true;

  constructor(leaf: WorkspaceLeaf, public plugin: MxPlugin) {
    super(leaf);
    this.contentEl.addClasses(["mx", "custom", "mx-transcript-view"]);
    this.register(
      this.store.subscribe((curr, prev) => {
        if (curr.source === prev.source && curr.title === prev.title) return;
        this.updateTitle();
      }),
    );
  }
  updateTitle = updateTitle;

  getState(): WebpageTranscriptViewState {
    const state = super.getState() as WebpageTranscriptViewState;
    const { source } = this.store.getState();
    if (!source) return state;
    if (isFileMediaInfo(source.url))
      throw new Error("Remote view don't handle file media");
    return { ...state, id: source.id, source: source.url.jsonState.source };
  }
  async setState(
    state: WebpageTranscriptViewState,
    result: ViewStateResult,
  ): Promise<void> {
    await super.setState(state, result);
    const { id, source } = state;
    if (!id || !source) return;
    const url = this.plugin.resolveUrl(state.source);
    if (!url) {
      console.warn("Invalid URL", state.source);
      return;
    } else if (isFileMediaInfo(url)) {
      console.warn("Open in-vault media in remote view", url);
      return;
    }
    const now = this.store.getState().source;
    if (now && compare(now.url, url) && id === now.id) return;
    this.store.getState().setSource({ id, url }, this.plugin);
  }

  getViewType(): string {
    return transcriptViewType.webpage;
  }
  getDisplayText(): string {
    const { source, title = "Transcript" } = this.store.getState();
    if (!source) {
      return title;
    }
    let display = title;
    if (source.label) {
      display += ` - ${source.label}`;
    }
    if (source.url.type !== MediaHost.Generic) {
      display += ` - ${mediaHostDisplayName[source.url.type]}`;
    }
    return display;
  }

  protected async onOpen(): Promise<void> {
    await super.onOpen();
    this.render();
  }
  render() {
    this.root?.unmount();
    this.root = ReactDOM.createRoot(this.contentEl);
    this.root.render(
      <TranscriptViewContext.Provider
        value={{
          plugin: this.plugin,
          store: this.store,
        }}
      >
        <LineView />
      </TranscriptViewContext.Provider>,
    );
  }

  getIcon(): string {
    return "subtitles";
  }

  onPaneMenu(menu: Menu, source: PaneMenuSource): void {
    super.onPaneMenu(menu, source);
    if (source === "more-options") {
      menu.addItem((item) => {
        item
          .setTitle("Find...")
          .setIcon("file-search")
          .setSection("action")
          .onClick(() => this.store.getState().toggleSearchBox());
      });
    }
  }

  async onClose() {
    this.root?.unmount();
    this.root = null;
    return super.onClose();
  }
}
