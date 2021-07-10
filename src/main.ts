import { Plugin, MarkdownPreviewRenderer, MarkdownView } from "obsidian";
import { DEFAULT_SETTINGS, MESettingTab, MxSettings } from "./settings";
import "plyr/dist/plyr.css";
import "./main.css";
import { getEmbedProcessor } from "embeds";
import { MediaView, MEDIA_VIEW_TYPE } from "./media-view";
import { getCMLinkHandler, getLinkProcessor } from "links";
import { getServer } from "fake-bili";

const linkSelector = "span.cm-url, span.cm-hmd-internal-link";
export default class MediaExtended extends Plugin {
  settings: MxSettings = DEFAULT_SETTINGS;

  server: ReturnType<typeof getServer> | undefined;

  private cmLinkHandler = getCMLinkHandler(this);

  async loadSettings() {
    Object.assign(this.settings, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onload(): Promise<void> {
    console.log("loading media-extended");

    await this.loadSettings();

    this.server = getServer(2233);

    this.addSettingTab(new MESettingTab(this.app, this));

    // register embed handlers
    if (this.settings.mediaFragmentsEmbed) {
      this.registerMarkdownPostProcessor(getEmbedProcessor(this, "internal"));
    }
    if (this.settings.timestampLink) {
      this.registerMarkdownPostProcessor(getLinkProcessor(this, "internal"));
    }

    // register link handlers
    if (this.settings.extendedImageEmbedSyntax) {
      this.registerMarkdownPostProcessor(getEmbedProcessor(this, "external"));
    }
    this.registerMarkdownPostProcessor(getLinkProcessor(this, "external"));
    this.registerCodeMirror((cm) => {
      const warpEl = cm.getWrapperElement();
      warpEl.on("mousedown", linkSelector, this.cmLinkHandler);
      this.register(() =>
        warpEl.off("mousedown", linkSelector, this.cmLinkHandler),
      );
    });

    this.registerView(MEDIA_VIEW_TYPE, (leaf) => new MediaView(leaf, this));
    this.addCommand({
      id: "get-timestamp",
      name: "Get timestamp from player",
      editorCheckCallback: (checking, _editor, view) => {
        const getMediaView = (group: string) =>
          this.app.workspace
            // @ts-ignore
            .getGroupLeaves(group)
            .find((leaf) => (leaf.view as MediaView).getTimeStamp !== undefined)
            ?.view as MediaView | undefined;
        // @ts-ignore
        const group: null | string = view.leaf.group;
        if (checking) {
          if (group) {
            const mediaView = getMediaView(group);
            if (mediaView && (mediaView as MediaView).getTimeStamp())
              return true;
          }
          return false;
        } else if (group) {
          getMediaView(group)?.addTimeStampToMDView(view);
        }
      },
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: "t",
        },
      ],
    });
  }

  onunload() {
    console.log("unloading media-extended");
    this.server?.close();
  }
}
