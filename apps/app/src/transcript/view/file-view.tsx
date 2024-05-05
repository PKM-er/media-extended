import type { Menu, TFile, WorkspaceLeaf } from "obsidian";
import { EditableFileView, Notice } from "obsidian";
import ReactDOM from "react-dom/client";
import LineView from "@/components/transcript/line";
import {
  getCaptionExts,
  getTrackInfoID,
  isSupportedCaptionExt,
  toTrack,
} from "@/info/track-info";
import type { PaneMenuSource } from "@/lib/menu";
import { compare } from "@/media-note/note-index/def";
import type MxPlugin from "@/mx-main";
import { transcriptViewType } from "../const";
import { createTranscriptViewStore, TranscriptViewContext } from "./context";

export class LocalTranscriptView extends EditableFileView {
  static register(plugin: MxPlugin) {
    plugin.registerView(
      transcriptViewType.local,
      (leaf) => new LocalTranscriptView(leaf, plugin),
    );
    plugin.registerExtensions(getCaptionExts(), transcriptViewType.local);
  }

  store = createTranscriptViewStore();
  root: ReactDOM.Root | null = null;
  // updateTitle = updateTitle;
  // registerTitleChange() {
  //   this.register(
  //     this.store.subscribe((now, prev) => {
  //       if (now.title !== prev.title) {
  //         this.updateTitle();
  //       }
  //     }),
  //   );
  // }
  // getDisplayText(): string {
  //   return this.store.getState().title ?? super.getDisplayText();
  // }

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
    const track = toTrack(file);
    if (!track) throw new Error(`Caption file not supported: ${file.path}`);
    this.registerEvent(
      this.app.workspace.on("mx:cue-change", (source, trackID, cueIDs) => {
        const { media, textTrack, updateActiveCues } = this.store.getState();
        if (
          !media ||
          !textTrack ||
          textTrack.id !== trackID ||
          !compare(source, media)
        )
          return;
        updateActiveCues(cueIDs);
      }),
    );

    const updateLinkedMedia = async () => {
      const { setLinkedMedia, updateActiveCues } = this.store.getState();
      const [media] = await this.plugin.transcript.getLinkedMedia(track);
      if (!setLinkedMedia(media || null) || !media) return;
      const leaf = this.plugin.leafOpener.findPlayerWithSameMedia(media);
      if (!leaf) return;
      const textTrack = leaf.view.player?.textTracks.selected;
      if (!textTrack) return;
      updateActiveCues(textTrack.activeCues.map((c) => c.id));
    };
    this.registerEvent(
      this.app.metadataCache.on("mx:transcript-changed", (trackIDs) => {
        const { textTrack } = this.store.getState();
        if (!textTrack || !trackIDs.has(textTrack.id)) return;
        updateLinkedMedia();
      }),
    );
    await Promise.allSettled([
      updateLinkedMedia(),
      this.plugin.transcript
        .loadAndParseTrack(track)
        .then((track) => {
          this.store.getState().setCaptions({
            track,
            id: getTrackInfoID(track).id,
            locales: track.language ? [track.language] : [],
          });
          this.render();
        })
        .catch((e) => {
          new Notice(
            `Failed to load subtitle ${file.path}: ${
              e instanceof Error ? e.message : "See console for details"
            }`,
          );
          console.error("Failed to load subtitle", file, e);
        }),
    ]);
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
