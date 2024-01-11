import { around } from "monkey-around";
import type { Component, WorkspaceLeaf } from "obsidian";
import { ItemView, Scope } from "obsidian";
import ReactDOM from "react-dom/client";
import { type MediaViewStoreApi } from "@/components/context";
import {
  createMediaViewStore,
  MediaViewContext,
  onPlayerMounted,
} from "@/components/context";
import { Player } from "@/components/player";
import { isTimestamp, parseTempFrag } from "@/lib/hash/temporal-frag";
import { handleWindowMigration } from "@/lib/window-migration";
import type MediaExtended from "@/mx-main";

export interface PlayerComponent extends Component {
  plugin: MediaExtended;
  store: MediaViewStoreApi;
  root: ReactDOM.Root | null;
}

export function setTempFrag(hash: string, store: MediaViewStoreApi) {
  store.setState({ hash });
  const tf = parseTempFrag(hash);
  const player = store.getState().player;
  if (player && tf) {
    // allow 0.25s offset from end, in case delay in seeking
    const allowedOffset = 0.25;
    if (
      isTimestamp(tf) ||
      player.currentTime < tf.start ||
      Math.abs(player.currentTime - tf.end) < allowedOffset
    ) {
      player.currentTime = tf.start;
    } else if (player.currentTime - allowedOffset > tf.end) {
      player.currentTime = tf.end;
    }
    if (isTimestamp(tf)) {
      player.play(new Event("hashchange"));
    }
  }
}

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
  protected _title = "";
  protected _sourceType = "";

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
        player.subscribe(({ title, source }) => {
          this._title = title;
          this._sourceType = source.type;
          this.updateTitle();
        }),
      ),
    );
  }

  abstract getViewType(): string;
  abstract getIcon(): string;
  abstract getDisplayText(): string;

  setEphemeralState(state: any): void {
    const { subpath = "" } = state;
    setTempFrag(subpath, this.store);
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
