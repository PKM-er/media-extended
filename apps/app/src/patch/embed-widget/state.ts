import type { EditorState } from "@codemirror/state";
import { StateField } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import { Decoration, EditorView } from "@codemirror/view";
import { editorEditorField, editorLivePreviewField } from "obsidian";
import type MediaExtended from "@/mx-main";

import getPlayerDecos from "./syntax-to-decos";
import createRangeUnion from "./union";

// const livePreviewToggled = (tr: Transaction) => {
//   const prev = tr.startState.field(editorLivePreviewField),
//     curr = tr.state.field(editorLivePreviewField);
//   if (prev === curr) return null;
//   else return curr;
// };

const defineStatefulDecoration = (
  plugin: MediaExtended,
): StateField<DecorationSet> => {
  const create = (state: EditorState): DecorationSet => {
    if (state.field(editorLivePreviewField)) {
      const decos: ReturnType<Decoration["range"]>[] = [];
      getPlayerDecos(plugin, state, decos);
      return Decoration.set(decos);
    } else {
      return Decoration.none;
    }
  };
  return StateField.define<DecorationSet>({
    create,
    update: (players, tr): DecorationSet => {
      const livePreviewPrev = tr.startState.field(editorLivePreviewField),
        livePreview = tr.state.field(editorLivePreviewField);

      if (livePreviewPrev !== livePreview) {
        return create(tr.state);
      } else if (!livePreview) {
        return Decoration.none;
      }
      if (!tr.docChanged) return players;
      if (tr.state.field(editorEditorField).composing)
        return players.map(tr.changes);
      players = players.map(tr.changes);
      const changedLines: [lineStart: number, lineEnd: number][] = [];
      tr.changes.iterChangedRanges((_f, _t, from, to) => {
        // lines that have changed
        changedLines.push([
          tr.state.doc.lineAt(from).number,
          tr.state.doc.lineAt(to).number,
        ]);
      });
      const decos: ReturnType<Decoration["range"]>[] = [];
      for (const [start, end] of createRangeUnion(changedLines)) {
        const { from } = tr.state.doc.line(start),
          { to } = tr.state.doc.line(end);
        // filter out deco in current line range
        players = players.update({
          filterFrom: from,
          filterTo: to,
          filter: () => false,
        });
        // recompute deco in current line range
        getPlayerDecos(plugin, tr.state, decos, from, to);
      }

      return players.update({ add: decos, sort: true });
    },
    provide: (field) => EditorView.decorations.from(field),
  });
};
export default defineStatefulDecoration;
