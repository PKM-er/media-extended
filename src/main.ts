import { Plugin, MarkdownPreviewRenderer, MarkdownView } from "obsidian";
import { DEFAULT_SETTINGS, MESettingTab, MxSettings } from "./settings";
import "plyr/dist/plyr.css";
import "./main.css";
import { getEmbedProcessor } from "embeds";
import { MediaView, MEDIA_VIEW_TYPE } from "./media-view";
import { cmLinkHandler, getLinkProcessor } from "links";

const linkSelector = "span.cm-url, span.cm-hmd-internal-link";
export default class MediaExtended extends Plugin {
  settings: MxSettings = DEFAULT_SETTINGS;

  private cmLinkHandler = cmLinkHandler.bind(this);

  async loadSettings() {
    Object.assign(this.settings, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onload(): Promise<void> {
    console.log("loading media-extended");

    await this.loadSettings();

    this.addSettingTab(new MESettingTab(this.app, this));

    if (this.settings.mediaFragmentsEmbed) {
      this.registerMarkdownPostProcessor(getEmbedProcessor(this, "internal"));
    }
    if (this.settings.timestampLink) {
      this.registerMarkdownPostProcessor(getLinkProcessor(this, "internal"));
    }
    if (this.settings.extendedImageEmbedSyntax) {
      this.registerMarkdownPostProcessor(getEmbedProcessor(this, "external"));
    }

    this.registerView(MEDIA_VIEW_TYPE, (leaf) => new MediaView(leaf, this));
    this.registerMarkdownPostProcessor(getLinkProcessor(this, "external"));
    this.addCommand({
      id: "get-timestamp",
      name: "Get timestamp from player",
      checkCallback: (checking) => {
        const activeLeaf = this.app.workspace.activeLeaf;
        const getMediaView = (group: string) =>
          this.app.workspace
            // @ts-ignore
            .getGroupLeaves(group)
            .find((leaf) => (leaf.view as MediaView).getTimeStamp !== undefined)
            ?.view as MediaView | undefined;
        if (checking) {
          if (
            activeLeaf.view instanceof MarkdownView &&
            activeLeaf.view.getMode() === "source" &&
            // @ts-ignore
            activeLeaf.group
          ) {
            // @ts-ignore
            const mediaView = getMediaView(activeLeaf.group);
            if (mediaView && (mediaView as MediaView).getTimeStamp())
              return true;
          }
          return false;
        } else {
          getMediaView(
            // @ts-ignore
            activeLeaf.group,
          )?.addTimeStampToMDView(activeLeaf.view as MarkdownView);
        }
      },
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: "t",
        },
      ],
    });

    this.registerCodeMirror((cm) => {
      const warpEl = cm.getWrapperElement();
      warpEl.on("mousedown", linkSelector, this.cmLinkHandler);
      this.register(() =>
        warpEl.off("mousedown", linkSelector, this.cmLinkHandler),
      );
    });
  }
}
