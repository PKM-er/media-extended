import { PlayerRenderChild } from "@view";

export type ElementWithRenderChild = HTMLElement & {
  renderChild?: PlayerRenderChild;
};

import "obsidian";

import { App, View, WorkspaceLeaf } from "obsidian";

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
