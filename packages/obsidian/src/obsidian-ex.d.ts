import "obsidian";

declare module "obsidian" {
  interface App {
    isMobile: boolean;
    plugins: {
      plugins: Record<string, any>;
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
    on(name: "mx-screenshot", callback: (blob: Blob) => any): EventRef;
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
