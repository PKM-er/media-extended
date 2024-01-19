import "@vidstack/react/player/styles/base.css";
import "./style.css";
import "./icons";

import { Plugin } from "obsidian";
import { handleMediaNote } from "./media-note";
import { LeafOpener } from "./media-note/leaf-open";
import {
  onExternalLinkClick,
  onInternalLinkClick,
} from "./media-note/link-click";
import { MediaNoteIndex } from "./media-note/note-index";
import { MediaFileEmbed } from "./media-view/file-embed";
import { AudioFileView, VideoFileView } from "./media-view/file-view";
import { MediaEmbedView } from "./media-view/iframe-view";
import { AudioUrlView, VideoUrlView } from "./media-view/url-view";
import {
  MEDIA_FILE_VIEW_TYPE,
  MEDIA_WEBPAGE_VIEW_TYPE,
  MEDIA_EMBED_VIEW_TYPE,
  MEDIA_URL_VIEW_TYPE,
} from "./media-view/view-type";
import { MediaWebpageView } from "./media-view/webpage-view";
import injectMediaEmbed from "./patch/embed";
import patchEditorClick from "./patch/link.editor";
import fixLinkLabel from "./patch/link.label-fix";
import patchPreviewClick from "./patch/link.preview";
import { MediaFileExtensions } from "./patch/media-type";
import injectMediaView from "./patch/view";
import { modifySession } from "./web/session";

export default class MxPlugin extends Plugin {
  async onload() {
    this.loadPatches();
    await this.modifySession();
    this.handleMediaNote();
  }

  mediaNote = this.addChild(new MediaNoteIndex(this.app));
  leafOpener = new LeafOpener(this);
  handleMediaNote = handleMediaNote;
  injectMediaEmbed = injectMediaEmbed;
  injectMediaView = injectMediaView;
  fixLinkLabel = fixLinkLabel;
  patchEditorClick = patchEditorClick;
  patchPreviewClick = patchPreviewClick;
  modifySession = modifySession;
  onExternalLinkClick = onExternalLinkClick.bind(this);
  onInternalLinkClick = onInternalLinkClick.bind(this);

  private loadPatches() {
    this.injectMediaView(
      MEDIA_FILE_VIEW_TYPE.audio,
      (leaf) => new AudioFileView(leaf, this),
      MediaFileExtensions.audio,
    );
    this.injectMediaView(
      MEDIA_FILE_VIEW_TYPE.video,
      (leaf) => new VideoFileView(leaf, this),
      MediaFileExtensions.video,
    );
    this.injectMediaEmbed(
      (info, file, subpath) => new MediaFileEmbed(info, file, subpath, this),
    );
    this.registerView(
      MEDIA_WEBPAGE_VIEW_TYPE,
      (leaf) => new MediaWebpageView(leaf, this),
    );
    this.registerView(
      MEDIA_EMBED_VIEW_TYPE,
      (leaf) => new MediaEmbedView(leaf, this),
    );
    this.registerView(
      MEDIA_URL_VIEW_TYPE.video,
      (leaf) => new VideoUrlView(leaf, this),
    );
    this.registerView(
      MEDIA_URL_VIEW_TYPE.audio,
      (leaf) => new AudioUrlView(leaf, this),
    );

    this.patchEditorClick({
      onExternalLinkClick: this.onExternalLinkClick,
      onInternalLinkClick: this.onInternalLinkClick,
    });
    this.patchPreviewClick({
      onExternalLinkClick: this.onExternalLinkClick,
      onInternalLinkClick: this.onInternalLinkClick,
    });
    this.fixLinkLabel();
  }
}
