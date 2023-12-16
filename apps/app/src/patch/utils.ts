import { MarkdownView, Plugin, Workspace } from "obsidian";

export function getMarkdownViewInstance(plugin: Plugin): Promise<MarkdownView> {
  const { app } = plugin;
  return new Promise((resolve) => {
    function tryGetMarkdownView() {
      const view = app.workspace.getLeavesOfType("markdown")[0];
      if (view) {
        resolve(view.view as MarkdownView);
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

export function getInstancePrototype<T>(instance: T): T {
  return (instance as any).constructor.prototype;
}

declare module "obsidian" {
  interface MarkdownPreviewView {
    rerender(full?: boolean): void;
  }
}

export function reloadMarkdownPreview(workspace: Workspace) {
  workspace.getLeavesOfType("markdown").forEach((leaf) => {
    (leaf.view as MarkdownView).previewMode?.rerender(true);
  });
}
