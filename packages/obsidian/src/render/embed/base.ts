import { PlayerRenderChild } from "@view";

export type ElementWithRenderChild = HTMLElement & {
  renderChild?: PlayerRenderChild;
};

import "obsidian";

import { App, View, WorkspaceLeaf } from "obsidian";

declare module "obsidian" {
  interface ViewRegistry {
    typeByExtension: Record<string, string>;
    viewByType: Record<string, ViewCreator>;
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
  interface App {
    viewRegistry: ViewRegistry;
  }
}

const getViewOfType = <V extends View = View>(
  type: string,
  app: App,
): V | null => {
  const vc = app.viewRegistry.getViewCreatorByType(type);
  return vc ? (vc(new (WorkspaceLeaf as any)(app)) as V) : null;
};

export const getViewCtorOfType = <V extends typeof View = typeof View>(
  type: string,
  app: App,
) => {
  let instance = getViewOfType(type, app);
  const ctor = instance?.constructor as V;
  if (!ctor) {
    console.error(`Could not get view constructor of type ${type}`);
    return null;
  } else {
    return ctor;
  }
};
