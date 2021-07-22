import "obsidian";

declare module "obsidian" {
  interface App {
    isMobile: boolean;
    plugins: {
      plugins: {
        [key: string]: any;
      };
    };
  }
  interface WorkspaceLeaf {
    group: string | null;
  }
}
