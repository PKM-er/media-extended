import type { App, MarkdownView, Plugin, View, Workspace } from "obsidian";
import { WorkspaceLeaf } from "obsidian";

export function getRunningViewInstance(
  type: "markdown",
  plugin: Plugin,
): Promise<MarkdownView>;
export function getRunningViewInstance<T extends View = View>(
  type: string,
  plugin: Plugin,
): Promise<T> {
  const { app } = plugin;
  return new Promise((resolve) => {
    function tryGetMarkdownView() {
      const view = app.workspace.getLeavesOfType(type)[0];
      if (view) {
        resolve(view.view as T);
        return true;
      }
      return false;
    }
    app.workspace.onLayoutReady(() => {
      if (tryGetMarkdownView()) return;
      const onLayoutChange = () => {
        if (tryGetMarkdownView())
          app.workspace.off("layout-change", onLayoutChange);
      };
      app.workspace.on("layout-change", onLayoutChange);
      plugin.register(() => app.workspace.off("layout-change", onLayoutChange));
    });
  });
}

export function getViewPrototype<T>(ctor: T): T {
  return (ctor as any).prototype;
}

export function getInstanceCtor<T>(instance: T): T {
  return (instance as any).constructor;
}

export function getInstancePrototype<T>(instance: T): T {
  return (instance as any).constructor.prototype;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MediaFileExtensions = {
  video: ["mp4", "webm", "ogv", "mov", "mkv"],
  audio: ["mp3", "wav", "m4a", "3gp", "flac", "ogg", "oga", "opus"],
};

declare module "obsidian" {
  interface MarkdownPreviewView {
    rerender(full?: boolean): void;
  }
  interface App {
    viewRegistry: ViewRegistry;
    embedRegistry: EmbedRegistry;
  }
  interface ViewRegistry {
    typeByExtension: Record<string, string>;
    viewByType: Record<string, ViewCreator>;
    getTypeByExtension(ext: string): string | undefined;
    getViewCreatorByType(type: string): ViewCreator | undefined;
    isExtensionRegistered(ext: string): boolean;
    registerExtensions(exts: string[], type: string): void;
    registerViewWithExtensions(
      exts: string[],
      type: string,
      viewCreator: ViewCreator,
    ): void;
    unregisterExtensions(exts: string[]): void;
    unregisterView(viewType: string): void;
  }

  interface EmbedInfo {
    app: App;
    containerEl: HTMLDivElement;
    depth: number;
    displayMode: boolean;
    linktext: string;
    showInline: boolean;
    sourcePath: string;
  }
  interface EmbedCreator {
    (info: EmbedInfo, file: TFile, subpath: string): EmbedComponent;
  }
  interface EmbedRegistry {
    embedByExtension: Record<string, EmbedCreator>;
    registerExtension(ext: string, creator: EmbedCreator): void;
    registerExtensions(exts: string[], creator: EmbedCreator): void;
    unregisterExtensions(exts: string[]): void;
    unregisterExtension(ext: string): void;
  }
  interface EmbedComponent extends Component {
    loadFile(): any;
  }
}

export function reloadMarkdownPreview(workspace: Workspace) {
  workspace.getLeavesOfType("markdown").forEach(async (leaf) => {
    // (leaf.view as MarkdownView).previewMode?.rerender(true);
    const state = leaf.getViewState();
    await leaf.setViewState({ type: "empty" });
    await leaf.setViewState(state);
  });
}

function createViewInstance<V>(type: string, app: App): V | null {
  const vc = app.viewRegistry.getViewCreatorByType(type);
  return vc ? (vc(new (WorkspaceLeaf as any)(app)) as V) : null;
}

export function getViewCtor<V>(type: string, app: App) {
  const instance = createViewInstance<V>(type, app);
  if (!instance) {
    console.error(`Could not get view constructor of type ${type}`);
    return null;
  } else {
    return getInstanceCtor(instance);
  }
}
