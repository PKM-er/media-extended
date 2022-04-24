import MediaExtended from "@plugin";
import { around } from "monkey-around";
import { App, Component, ViewStateResult, WorkspaceLeaf } from "obsidian";

import { PromptToOpenMediaLink } from "./command";

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
export const patchEmptyView = (plugin: MediaExtended) => {
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
          item.addEventListener("click", PromptToOpenMediaLink);
        },
    }),
  );
};
