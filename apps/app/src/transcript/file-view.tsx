import type { Menu, TFile, WorkspaceLeaf } from "obsidian";
import { EditableFileView } from "obsidian";
import ReactDOM from "react-dom/client";
import LineView from "@/components/transcript/line";
import type { PaneMenuSource } from "@/lib/menu";
import type MxPlugin from "@/mx-main";
import {
  isCaptionFile,
  isSupportedCaptionExt,
  supportedCaptionExts,
  toTrack,
  transcriptViewType,
} from "./const";
import { createTranscriptViewStore, TranscriptViewContext } from "./context";

export class LocalTranscriptView extends EditableFileView {
  static register(plugin: MxPlugin) {
    plugin.registerView(
      transcriptViewType.local,
      (leaf) => new LocalTranscriptView(leaf, plugin),
    );
    plugin.registerExtensions(
      supportedCaptionExts as unknown as string[],
      transcriptViewType.local,
    );
  }

  store = createTranscriptViewStore();
  root: ReactDOM.Root | null = null;

  constructor(leaf: WorkspaceLeaf, public plugin: MxPlugin) {
    super(leaf);
    this.contentEl.addClasses(["mx", "custom", "mx-transcript-view"]);
  }

  allowNoFile = false;
  canAcceptExtension(extension: string): boolean {
    return isSupportedCaptionExt(extension);
  }
  getViewType(): string {
    return transcriptViewType.local;
  }
  async onLoadFile(file: TFile): Promise<void> {
    await super.onLoadFile(file);
    if (!isCaptionFile(file))
      throw new Error(`Caption file not supported: ${file.path}`);
    const track = toTrack(file);
    const content = await this.app.vault.cachedRead(file);
    await this.store.getState().parseCaptions(content, {
      type: file.extension,
      locales: track.language ? [track.language] : [],
    });
    this.render();
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
