import { around } from "monkey-around";
import type { ViewStateResult, WorkspaceLeaf } from "obsidian";
import { ItemView, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import {
  createMediaViewStore,
  MediaViewContext,
  onPlayerMounted,
} from "@/components/context";
import { Player } from "@/components/player";
import { handleWindowMigration } from "@/components/use-window-migration";
import type MediaExtended from "@/mx-main";
import { SupportedWebHost, matchHost, webHostDisplayName } from "@/web/match";
import type { PlayerComponent } from "./base";

declare module "obsidian" {
  interface View {
    titleEl: HTMLElement;
  }
  interface WorkspaceLeaf {
    updateHeader(): void;
  }
  interface Workspace {
    requestActiveLeafEvents(): boolean;
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MEDIA_WEBPAGE_VIEW_TYPE = "mx-webpage";

interface MediaWebpageViewState {
  source?: string;
}

export class MediaWebpageView extends ItemView implements PlayerComponent {
  // no need to manage scope manually,
  // as it's implicitly called and handled by the WorkspaceLeaf
  store;
  scope: Scope;
  root: ReactDOM.Root | null = null;
  private _title = "";

  constructor(leaf: WorkspaceLeaf, public plugin: MediaExtended) {
    super(leaf);
    this.store = createMediaViewStore();
    this.scope = new Scope(this.app.scope);
    this.contentEl.addClasses(["mx", "custom"]);
    // this.register(
    //   this.containerEl.onWindowMigrated(() => {
    //     this.render();
    //   }),
    // );
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

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

    handleWindowMigration.call(this, () => this.render());
    this.register(
      onPlayerMounted(this.store, (player) =>
        player.subscribe(({ title }) => {
          this._title = title;
          this.updateTitle();
        }),
      ),
    );
  }

  getViewType(): string {
    return MEDIA_WEBPAGE_VIEW_TYPE;
  }
  getIcon(): string {
    const host = this.getHost();
    if (host === SupportedWebHost.Generic) {
      return "globe";
    }
    return host;
  }

  getHost(): SupportedWebHost {
    const { source } = this.getState();
    if (!source) return SupportedWebHost.Generic;
    return matchHost(source);
  }
  getDisplayText(): string {
    const title = this._title;
    if (!title) return "Webpage";
    return `${title} - ${webHostDisplayName[this.getHost()]}`;
  }

  async setState(
    state: MediaWebpageViewState,
    result: ViewStateResult,
  ): Promise<void> {
    if (typeof state.source === "string") {
      this.store.setState({ source: { src: `webview::${state.source}` } });
    }
    return super.setState(state, result);
  }
  getState(): MediaWebpageViewState {
    const fromStore = this.store.getState();
    const state = super.getState();
    return {
      ...state,
      source: fromStore.source?.src.replace(/^webview::/, ""),
    };
  }
  setEphemeralState(state: any): void {
    const { subpath = "" } = state;
    this.store.setState({ hash: subpath });
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
