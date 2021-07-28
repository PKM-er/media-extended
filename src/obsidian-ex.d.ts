import "obsidian";

declare module "obsidian" {
  interface App {
    isMobile: boolean;
    plugins: {
      plugins: Record<string, any>;
    };
    viewRegistry: ViewRegistry;
  }
  interface WorkspaceLeaf {
    group: string | null;
  }

  interface Vault {
    exists: DataAdapter["exists"];
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
    onDelete(file: TFile): void;
    onRename(file: TFile): void;
  }
}
