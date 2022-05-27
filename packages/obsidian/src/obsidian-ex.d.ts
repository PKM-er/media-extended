import "obsidian";

import type { MediaMeta } from "mx-store";

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
    hotkeyManager: {
      onTrigger: (evt: KeyboardEvent, hotkey: any) => true | void;
    };
  }

  interface Command {
    repeatable?: boolean;
  }
  interface WorkspaceLeaf {
    group: string | null;
  }
  interface MenuItem {
    dom: HTMLElement;
  }

  interface Vault {
    exists: DataAdapter["exists"];
    getAvailablePathForAttachments(
      path: string,
      extension: string,
      activeFile: TFile | null,
    ): Promise<string>;
  }
  interface Workspace {
    on(
      name: "mx:screenshot",
      callback: (
        ab: ArrayBuffer,
        time: number,
        ext: "jpg" | "webp",
        source: MediaMeta,
      ) => any,
    ): EventRef;
    on(
      name: "mx:timestamp",
      callback: (time: number, duration: number, source: MediaMeta) => any,
    ): EventRef;
    trigger(
      name: "mx:screenshot",
      ab: ArrayBuffer,
      time: number,
      ext: "jpg" | "webp",
      source: MediaMeta,
    ): void;
    trigger(
      name: "hover-link",
      info: {
        event: Event;
        source: string;
        hoverParent: HTMLElement;
        targetEl: HTMLElement;
        linktext: string;
        sourcePath: string;
      },
    );
    trigger(
      name: "mx:timestamp",
      time: number,
      duration: number,
      source: MediaMeta,
    ): void;

    trigger(
      name: "media-url-menu",
      menu: Menu,
      url: string,
      source: string,
      leaf?: WorkspaceLeaf,
    ): void;
    on(
      name: "media-url-menu",
      callback: (
        menu: Menu,
        url: string,
        source: string,
        leaf?: WorkspaceLeaf,
      ) => any,
      ctx?: any,
    ): EventRef;
    on(
      name: "url-menu",
      callback: (menu: Menu, url: string) => any,
      ctx?: any,
    ): EventRef;
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
  }

  interface FileView {
    onDelete(file: TFile): Promise<void>;
    onRename(file: TFile): Promise<void>;
  }

  interface WorkspaceSplit {
    containerEl: HTMLElement;
  }
}
