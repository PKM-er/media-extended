import { around } from "monkey-around";
import type { WorkspaceLeaf, Menu } from "obsidian";
import { ItemView, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import {
  createMediaViewStore,
  MediaViewContext,
  onPlayerMounted,
} from "@/components/context";
import { Player } from "@/components/player";
import { handleWindowMigration } from "@/lib/window-migration";
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
    this.store = createMediaViewStore();
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

  onPaneMenu(
    menu: Menu,
    menuSource: "sidebar-context-menu" | "tab-header" | "more-options",
  ): void {
    super.onPaneMenu(menu, menuSource);
    onPaneMenu(this, menu, menuSource);
  }

  getState(): MediaRemoteViewState {
    const state = super.getState() as MediaRemoteViewState;
    const url = this.store.getState().source?.url;
    return {
      ...state,
      source: url ? url.jsonState.source : state.source,
    };
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

  updateTitle() {
    const newTitle = this.getDisplayText();
    this.titleEl.setText(newTitle);

    if (
      // eslint-disable-next-line deprecation/deprecation
      this.app.workspace.activeLeaf === this.leaf &&
      this.app.workspace.requestActiveLeafEvents()
    ) {
      this.leaf.updateHeader();
    }
  }

  render() {
    this.root?.unmount();
    this.root = ReactDOM.createRoot(this.contentEl);
    this.root.render(
      <MediaViewContext.Provider
        value={{
          plugin: this.plugin,
          store: this.store,
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
