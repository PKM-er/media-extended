import "@vidstack/react/player/styles/base.css";
import "./style.css";
import "./icons";

import { Plugin } from "obsidian";
import { MediaFileEmbed } from "./media-view/file-embed";
import {
  AudioFileView,
  MEDIA_FILE_VIEW_TYPE,
  VideoFileView,
} from "./media-view/file-view";
import {
  MEDIA_WEBPAGE_VIEW_TYPE,
  MediaWebpageView,
} from "./media-view/webpage-view";
import injectMediaEmbed from "./patch/embed";
import patchEditorClick from "./patch/link.editor";
import fixLinkLabel from "./patch/link.label-fix";
import patchPreviewClick from "./patch/link.preview";
import { MediaFileExtensions } from "./patch/utils";
import injectMediaView from "./patch/view";

export default class MxPlugin extends Plugin {
  async onload() {
    this.loadPatches();
  }

  injectMediaEmbed = injectMediaEmbed;
  injectMediaView = injectMediaView;
  fixLinkLabel = fixLinkLabel;
  patchEditorClick = patchEditorClick;
  patchPreviewClick = patchPreviewClick;

  private loadPatches() {
    this.injectMediaView(
      MEDIA_FILE_VIEW_TYPE.AUDIO,
      (leaf) => new AudioFileView(leaf, this),
      MediaFileExtensions.audio,
    );
    this.injectMediaView(
      MEDIA_FILE_VIEW_TYPE.VIDEO,
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
    this.fixLinkLabel();
  }
}
