import { syntaxTree, tokenClassNodeProp } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { WidgetType } from "@codemirror/view";
import { Decoration } from "@codemirror/view";
// import { editorInfoField } from "obsidian";
import { parseUrl } from "@/media-note/note-index/url-info";
import type MediaExtended from "@/mx-main";

// import { getFileHashFromLinktext } from "../../player/thunk/set-media";
import { isMdFavorInternalLink } from "./utils";
import { WidgetCtorMap } from "./widget";

const getPlayerDecos = (
  plugin: MediaExtended,
  state: EditorState,
  decos: ReturnType<Decoration["range"]>[],
  from?: number,
  to?: number,
) => {
  // const mdView = state.field(editorInfoField),
  // sourcePath = mdView.file?.path ?? "";

  // if (!sourcePath) console.warn("missing sourcePath", mdView);

  const doc = state.doc;
  let isImgEmbed = !1,
    imgAltText = "",
    imgUrlText = "",
    imgMarkLoc = -1;

  syntaxTree(state).iterate({
    from,
    to,
    enter: ({ type, from, to }) => {
      const nodeTypes = new Set(
        (type.prop(tokenClassNodeProp) as string | undefined)?.split(" "),
      );
      if (!nodeTypes) return;
      if (nodeTypes.has("image-marker")) {
        isImgEmbed = true;
        imgMarkLoc = from;
      } else if (
        nodeTypes.has("image-alt-text") &&
        !nodeTypes.has("formatting")
      ) {
        imgAltText = doc.sliceString(from, to);
      } else if (
        isImgEmbed &&
        nodeTypes.has("url") &&
        !nodeTypes.has("formatting")
      ) {
        imgUrlText = doc.sliceString(from, to);
      } else if (isImgEmbed && imgUrlText && nodeTypes.has("formatting")) {
        if (isMdFavorInternalLink(imgUrlText)) {
          return;
        }
        const urlInfo = parseUrl(imgUrlText);
        if (urlInfo) {
          const widget = new WidgetCtorMap[urlInfo.viewType](
            plugin,
            urlInfo,
            imgAltText,
            imgMarkLoc,
            to,
          );
          addDeco(widget, imgMarkLoc, to);
        }

        isImgEmbed = false;
        imgUrlText = "";
        imgAltText = "";
        imgMarkLoc = -1;
      }
    },
  });
  function addDeco(widget: WidgetType, from: number, to: number) {
    const side = -1; // place the player widget after default live preview widget
    const { from: lineFrom, text: lineText } = doc.lineAt(from),
      isWholeLine =
        "" === lineText.substring(0, from - lineFrom).trim() &&
        "" === lineText.substring(to - lineFrom).trim();
    if (isWholeLine) {
      decos.push(
        Decoration.widget({ widget, block: true, side }).range(lineFrom),
      );
    } else {
      decos.push(Decoration.widget({ widget, side }).range(from));
    }
  }
};

export default getPlayerDecos;
