import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { tokenClassNodeProp } from "@codemirror/stream-parser";
import { Decoration, WidgetType } from "@codemirror/view";
import type MediaExtended from "@plugin";
import { getMediaType } from "mx-base";
import { editorViewField } from "obsidian";

import { getFileHashFromLinktext } from "../../player/thunk/set-media";
import {
  getUrlFromMarkdown,
  isMdFavorInternalLink,
  normalizeSpace,
  parseLinktextAlias,
  toVaildURL,
} from "./utils";
import { ExternalEmbedWidget, InternalEmbedWidget } from "./widget";

const getPlayerDecos = (
  plugin: MediaExtended,
  state: EditorState,
  decos: ReturnType<Decoration["range"]>[],
  from?: number,
  to?: number,
) => {
  let mdView = state.field(editorViewField),
    sourcePath = mdView.file?.path ?? "";

  if (!sourcePath) console.warn("missing sourcePath", mdView);

  let doc = state.doc;
  let isInternalEmbed = !1,
    embedStartFrom = -1,
    embedStartTo = -1,
    embedLinkTextTo = -1,
    embedLinkText = "";
  let isImgEmbed = !1,
    imgAltText = "",
    imgUrl = "",
    imgMarkLoc = -1,
    imgUrlFrom = -1,
    imgUrlTo = -1;

  const getInternalPlayerWidget = (
    linktextAlias: string,
    from: number,
    to: number,
  ) => {
    const { href: linktext, title } = parseLinktextAlias(linktextAlias);
    const result = getFileHashFromLinktext(linktext, sourcePath);
    if (!result || !getMediaType(result[0])) return null;
    let widget = new InternalEmbedWidget(
      plugin,
      { linktext, file: result[0], hash: result[1] },
      title,
      from,
      to,
    );
    return widget;
  };
  const getExternalPlayerWidget = (
    src: string,
    alt: string,
    from: number,
    to: number,
  ) => {
    let widget = new ExternalEmbedWidget(plugin, { src }, alt, from, to);
    return widget;
  };

  const side = -1; // place the player widget after default live preview widget
  const addDeco = (widget: WidgetType, from: number, to: number) => {
    const { from: lineFrom, to: lineTo, text: lineText } = doc.lineAt(from),
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
  };

  syntaxTree(state).iterate({
    from,
    to,
    enter: (type, from, to) => {
      const nodeTypes = new Set(type.prop(tokenClassNodeProp)?.split(" "));
      if (!nodeTypes) return;
      if (nodeTypes.has("formatting-link-start")) {
        isInternalEmbed = nodeTypes.has("formatting-embed");
        embedStartFrom = from;
        embedStartTo = to;
      } else if (embedStartFrom > -1)
        if (nodeTypes.has("hmd-internal-link")) {
          embedLinkText += doc.sliceString(from, to);
          embedLinkTextTo = to;
        } else {
          if (nodeTypes.has("formatting-link-end") && embedLinkText)
            if (isInternalEmbed) {
              const widget = getInternalPlayerWidget(
                embedLinkText,
                embedStartTo,
                embedLinkTextTo,
              );
              widget && addDeco(widget, embedStartFrom, to);
            } else {
              // internal link, do nothing
            }
          embedLinkText = "";
          embedStartFrom = -1;
        }
      else if (nodeTypes.has("image-marker")) {
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
        imgUrl = doc.sliceString(from, to);
        imgUrlFrom = from;
        imgUrlTo = to;
      } else if (isImgEmbed && imgUrl && nodeTypes.has("formatting")) {
        let widget: WidgetType | null = null;
        imgUrl = getUrlFromMarkdown(imgUrl);
        if (isMdFavorInternalLink(imgUrl)) {
          let linktext;
          try {
            linktext = decodeURI(imgUrl);
          } catch (e) {
            return;
          }
          linktext = normalizeSpace(linktext).trim();
          widget = getInternalPlayerWidget(
            linktext + "|" + imgAltText,
            imgMarkLoc,
            to,
          );
        } else {
          imgUrl = toVaildURL(imgUrl);
          // const fileProtocol = "file:///";
          // if (Platform.isDesktopApp && imgUrl.startsWith(fileProtocol)) {
          //   imgUrl = "app://local/" + imgUrl.substring(fileProtocol.length);
          // }
          widget = getExternalPlayerWidget(imgUrl, imgAltText, imgMarkLoc, to);
        }
        widget && addDeco(widget, imgMarkLoc, to);

        isImgEmbed = false;
        imgUrl = "";
        imgAltText = "";
        imgMarkLoc = -1;
        imgUrlFrom = -1;
        imgUrlTo = -1;
      }
    },
  });
};

export default getPlayerDecos;
