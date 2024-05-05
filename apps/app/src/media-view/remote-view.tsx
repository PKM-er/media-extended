import { around } from "monkey-around";
import type { WorkspaceLeaf, Menu, ViewStateResult } from "obsidian";
import { ItemView, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import type { SourceFacet } from "@/components/context";
import {
  createMediaViewStore,
  MediaViewContext,
  onPlayerMounted,
} from "@/components/context";
import { Player } from "@/components/player";
import { isFileMediaInfo } from "@/info/media-info";
import type { MediaURL } from "@/info/media-url";
import type { PaneMenuSource } from "@/lib/menu";
import { updateTitle } from "@/lib/view-title";
import { handleWindowMigration } from "@/lib/window-migration";
import { compare } from "@/media-note/note-index/def";
import type MediaExtended from "@/mx-main";
import type { PlayerComponent } from "./base";
import { addAction, onPaneMenu } from "./base";
import type { RemoteMediaViewType } from "./view-type";

export interface MediaRemoteViewState {
  source?: string;
}

export abstract class MediaRemoteView
  extends ItemView
  implements PlayerComponent
{
  // no need to manage scope manually,
  // as it's implicitly called and handled by the WorkspaceLeaf
  store;
  scope: Scope;
  root: ReactDOM.Root | null = null;
  navigation = true;
  get player() {
    return this.store.getState().player;
  }
  async setSource(url: MediaURL): Promise<SourceFacet> {
    const textTracks = await this.plugin.transcript.getTracks(url);
    return { viewType: this.getViewType(), textTracks };
  }
  getMediaInfo() {
    return this.store.getState().source?.url ?? null;
  }
  get sourceType(): string {
    return this.store.getState().player?.state.source.type ?? "";
  }
  get playerTitle(): string {
    return this.store.getState().player?.state.title ?? "";
  }

  constructor(leaf: WorkspaceLeaf, public plugin: MediaExtended) {
    super(leaf);
    this.store = createMediaViewStore(plugin);
    this.scope = new Scope(this.app.scope);
    this.contentEl.addClasses(["mx", "custom"]);
    addAction(this);
  }

  onload(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    super.onload();
    // make sure to unmount the player before the leaf detach it from DOM
    this.register(
      around(this.leaf, {
        detach: (next) =>
          function (this: WorkspaceLeaf, ...args) {
            self.root?.unmount();
            self.root = null;
            return next.call(this, ...args);
          },
      }),
    );
    handleWindowMigration(this, () => this.render());
  }

  registerRemoteTitleChange() {
    this.register(
      onPlayerMounted(this.store, (player) =>
        player.subscribe(({ title }) => {
          title;
          this.updateTitle();
        }),
      ),
    );
  }

  abstract getViewType(): RemoteMediaViewType;
  abstract getIcon(): string;
  abstract getDisplayText(): string;

  onPaneMenu(menu: Menu, menuSource: PaneMenuSource): void {
    super.onPaneMenu(menu, menuSource);
    onPaneMenu(this, menu, menuSource);
  }

  getState(): MediaRemoteViewState {
    const state = super.getState() as MediaRemoteViewState;
    const url = this.store.getState().source?.url;
    if (isFileMediaInfo(url))
      throw new Error("Remote view don't handle file media");

    return {
      ...state,
      source: url ? url.jsonState.source : state.source,
    };
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
    if (!("source" in state)) return;
    const url = this.plugin.resolveUrl(state.source);
    if (!url) {
      console.warn("Invalid URL", state.source);
    } else if (isFileMediaInfo(url)) {
      console.warn("Open in-vault media in remote view", url);
    } else {
      const now = this.store.getState().source?.url;
      if (!compare(url, now)) {
        this.store.getState().setSource(url, await this.setSource(url));
        // workaround for vidstack issue when refresh source
        // including subtitle default not applied
        // provider not loaded properly when switched
        this.render();
      }
    }
  }

  setEphemeralState(state: any): void {
    if ("subpath" in state) {
      const { subpath } = state;
      this.store.getState().setHash(subpath);
    }
    super.setEphemeralState(state);
  }

  protected async onOpen(): Promise<void> {
    await super.onOpen();
    this.render();
  }

  updateTitle = updateTitle;
  render() {
    if (this.root) {
      // this.contentEl
      //   .querySelectorAll<HTMLIFrameElement>("iframe, webview")
      //   .forEach((el) => {
      //     el.src = "";
      //   });
      this.root.unmount();
    }
    this.root = ReactDOM.createRoot(this.contentEl);
    this.root.render(
      <MediaViewContext.Provider
        value={{
          plugin: this.plugin,
          store: this.store,
          reload: () => this.render(),
          onPlaylistChange: (item) => {
            item.media.hash += "&play";
            this.plugin.leafOpener.openMediaIn(this.leaf, item.media);
          },
          embed: false,
        }}
      >
        <Player />
      </MediaViewContext.Provider>,
    );
  }

  close() {
    this.root?.unmount();
    this.root = null;
    // @ts-expect-error -- this would call leaf.detach()
    return super.close();
  }
  async onClose() {
    this.root?.unmount();
    this.root = null;
    return super.onClose();
  }
}
