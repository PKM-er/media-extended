import type { Editor } from "obsidian";

export function insertToCursor(str: string, editor: Editor) {
  const cursor = editor.getCursor("to");
  console.debug("insert to cursor [to]", cursor.ch, cursor.line);
  editor.replaceRange(str, cursor, cursor);
  editor.setCursor(editor.offsetToPos(editor.posToOffset(cursor) + str.length));
}
export function insertBeforeCursor(str: string, editor: Editor) {
  const cursor = editor.getCursor("from");
  console.debug("insert before cursor [from]", cursor.ch, cursor.line);
  editor.replaceRange(str, cursor, cursor);
  // editor.setCursor(editor.offsetToPos(editor.posToOffset(cursor) + str.length));
}
