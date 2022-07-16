import type { Constructor, MarkdownView, View, WorkspaceLeaf } from "obsidian";
export const insertToCursor = async (str: string, view: MarkdownView) => {
  const { editor } = view;
  const cursor = editor.getCursor("to");
  if (view.getMode() === "source") {
    editor.replaceRange(str, cursor, cursor);
    editor.setCursor(
      editor.offsetToPos(editor.posToOffset(cursor) + str.length),
    );
  } else {
    const pos = editor.posToOffset(cursor),
      doc = editor.getValue();
    return app.vault.modify(
      view.file,
      doc.slice(0, pos) + str + doc.slice(pos),
    );
  }
};
export const getMostRecentViewOfType = <T extends View>(
  ctor: Constructor<T>,
): T | null => {
  const leaf = getMostRecentLeafOfView(ctor);
  return leaf ? (leaf.view as T) : null;
};

declare module "obsidian" {
  interface WorkspaceLeaf {
    activeTime: number;
  }
}

export const getMostRecentLeafOfView = <T extends View>(
  ctor: Constructor<T>,
): WorkspaceLeaf | null => {
  if (app.workspace.activeLeaf?.view instanceof ctor)
    return app.workspace.activeLeaf;

  let recent: WorkspaceLeaf | null = null;
  app.workspace.iterateAllLeaves((leaf) => {
    if (
      leaf.view instanceof ctor &&
      (!recent || recent.activeTime < leaf.activeTime)
    ) {
      recent = leaf;
    }
  });
  return recent;
};
