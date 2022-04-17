import "obsidian";

import { Source } from "@slice/provider-types";

declare module "obsidian" {
  interface App {
    isMobile: boolean;
    plugins: {
      plugins: Record<string, any>;
      manifests: Record<string, { dir: string; [k: string]: any } | undefined>;
    };
    internalPlugins: {
      plugins: Record<string, any>;
    };
    viewRegistry: ViewRegistry;
  }
  interface WorkspaceLeaf {
    group: string | null;
  }
  interface MenuItem {
    dom: HTMLElement;
  }

  interface Vault {
    exists: DataAdapter["exists"];
  }
  interface Workspace {
    on(
      name: "mx:screenshot",
      callback: (ab: ArrayBuffer, source: Source) => any,
    ): EventRef;
    on(
      name: "mx:timestamp",
      callback: (time: number, source: Source) => any,
    ): EventRef;
    trigger(name: "mx:screenshot", ab: ArrayBuffer, source: Source): void;
    trigger(name: "mx:timestamp", time: number, source: Source): void;
  }

  interface ViewRegistry {
    typeByExtension: Record<string, string>;
    viewByType: Record<string, ViewCreator>;
    isExtensionRegistered(ext: string): boolean;
    registerExtensions(exts: string[], type: string): void;
    registerViewWithExtensions(
      exts: string[],
      type: string,
      viewCreator: ViewCreator,
    ): void;
    unregisterExtensions(exts: string[]): void;
  }

  interface FileView {
    onDelete(file: TFile): Promise<void>;
    onRename(file: TFile): Promise<void>;
  }

  interface WorkspaceSplit {
    containerEl: HTMLElement;
  }
}
