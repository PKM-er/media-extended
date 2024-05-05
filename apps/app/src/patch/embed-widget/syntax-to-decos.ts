import { syntaxTree, tokenClassNodeProp } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { WidgetType } from "@codemirror/view";
import { Decoration } from "@codemirror/view";
// import { editorInfoField } from "obsidian";
import { isFileMediaInfo } from "@/info/media-info";
import { shouldOpenMedia } from "@/media-note/link-click";
import type MediaExtended from "@/mx-main";

import { isMdFavorInternalLink } from "./utils";
import { InvalidNoticeWidget, WidgetCtorMap } from "./widget";

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
  let imgInfo: { alt?: string; url?: string; imgMarkLoc: number } | null = null;

  syntaxTree(state).iterate({
    from,
    to,
    enter: ({ type, from, to }) => {
      const nodeTypes = new Set(
        (type.prop(tokenClassNodeProp) as string | undefined)?.split(" "),
      );
      if (nodeTypes.size === 0) return;
      if (nodeTypes.has("image-marker")) {
        imgInfo = { imgMarkLoc: from };
        return;
      }

      if (!imgInfo) return;

      if (nodeTypes.has("image-alt-text") && !nodeTypes.has("formatting")) {
        imgInfo.alt = doc.sliceString(from, to);
        return;
      }

      if (nodeTypes.has("url") && !nodeTypes.has("formatting")) {
        imgInfo.url = doc.sliceString(from, to);
        return;
      }

      if (!(nodeTypes.has("formatting") && imgInfo.url)) return;

      const { imgMarkLoc, alt, url } = imgInfo;
      imgInfo = null;
      if (isMdFavorInternalLink(url)) return;
      const urlInfo = plugin.resolveUrl(url);

      if (!urlInfo) return;
      if (isFileMediaInfo(urlInfo)) {
        const link = plugin.app.metadataCache.fileToLinktext(urlInfo.file, "");
        addDeco(
          new InvalidNoticeWidget(
            `Please use internal embed in favor of file url embed: ![[${link}]]`,
            imgMarkLoc,
            to,
          ),
          imgMarkLoc,
          to,
        );
      } else if (shouldOpenMedia(urlInfo, plugin)) {
        const viewType = plugin.urlViewType.getPreferred(urlInfo);
        const widget = new WidgetCtorMap[viewType](
          plugin,
          urlInfo,
          alt ?? "",
          imgMarkLoc,
          to,
        );
        addDeco(widget, imgMarkLoc, to);
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
