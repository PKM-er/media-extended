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
import type { MediaEmbedViewState } from "./media-view/iframe-view";
import {
  MEDIA_EMBED_VIEW_TYPE,
  MediaEmbedView,
  isEmbedSrc,
} from "./media-view/iframe-view";
import type { MediaWebpageViewState } from "./media-view/webpage-view";
import {
  MEDIA_WEBPAGE_VIEW_TYPE,
  MediaWebpageView,
} from "./media-view/webpage-view";
import injectMediaEmbed from "./patch/embed";
import type { LinkEvent } from "./patch/event";
import patchEditorClick from "./patch/link.editor";
import fixLinkLabel from "./patch/link.label-fix";
import patchPreviewClick from "./patch/link.preview";
import { MediaFileExtensions } from "./patch/utils";
import injectMediaView from "./patch/view";
import { SupportedWebHost, matchHost, noHash } from "./web/match";
import { modifySession } from "./web/session";

export default class MxPlugin extends Plugin {
  async onload() {
    this.loadPatches();
    await this.modifySession();
  }

  injectMediaEmbed = injectMediaEmbed;
  injectMediaView = injectMediaView;
  fixLinkLabel = fixLinkLabel;
  patchEditorClick = patchEditorClick;
  patchPreviewClick = patchPreviewClick;
  modifySession = modifySession;

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
    this.registerView(
      MEDIA_EMBED_VIEW_TYPE,
      (leaf) => new MediaEmbedView(leaf, this),
    );
    const onExternalLinkClick: LinkEvent["onExternalLinkClick"] = async (
      rawUrl,
      newLeaf,
      fallback,
    ) => {
      const isEmbed = isEmbedSrc(rawUrl);
      if (isEmbed) {
        try {
          const url = new URL(rawUrl);
          const noHashUrl = noHash(url);
          const existingPlayerLeaves = this.app.workspace
            .getLeavesOfType(MEDIA_EMBED_VIEW_TYPE)
            .filter((l) => {
              const { source } = l.view.getState() as MediaEmbedViewState;
              return source && source === noHashUrl;
            });
          const { hash } = url;
          if (existingPlayerLeaves.length > 0) {
            const leaf = existingPlayerLeaves[0];
            leaf.setEphemeralState({ subpath: hash });
          } else {
            let leaf;
            if (newLeaf) leaf = this.app.workspace.getLeaf("split", "vertical");
            else leaf = this.app.workspace.getLeaf(false);
            await leaf.setViewState(
              {
                type: MEDIA_EMBED_VIEW_TYPE,
                state: { source: noHashUrl },
                active: true,
              },
              { subpath: hash },
            );
          }
          return;
        } catch {
          // ignore
        }
      }
      const matchResult = matchHost(rawUrl);
      if (!matchResult || matchResult.type === SupportedWebHost.Generic) {
        return fallback();
      }
      const existingPlayerLeaves = this.app.workspace
        .getLeavesOfType(MEDIA_WEBPAGE_VIEW_TYPE)
        .filter((l) => {
          const { source } = l.view.getState() as MediaWebpageViewState;
          const matched = matchHost(source);
          return matched && matched.noHash === matchResult.noHash;
        });
      if (existingPlayerLeaves.length > 0) {
        const leaf = existingPlayerLeaves[0];
        const { hash } = matchResult;
        leaf.setEphemeralState({ subpath: hash });
      } else {
        let leaf;
        if (newLeaf) leaf = this.app.workspace.getLeaf("split", "vertical");
        else leaf = this.app.workspace.getLeaf(false);
        const { hash, url } = matchResult;
        // const view = await leaf.open(new MediaWebpageView(leaf, this));
        await leaf.setViewState(
          {
            type: MEDIA_WEBPAGE_VIEW_TYPE,
            state: { source: url },
            active: true,
          },
          { subpath: hash },
        );
      }
    };
    this.patchEditorClick({ onExternalLinkClick });
    this.patchPreviewClick({ onExternalLinkClick });
    this.fixLinkLabel();
  }
}
