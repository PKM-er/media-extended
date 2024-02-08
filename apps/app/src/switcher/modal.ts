import { pathToFileURL } from "url";
import { Keymap, Notice, Platform, SuggestModal } from "obsidian";
import { pickFile } from "@/lib/picker";
import { toURL } from "@/lib/url";
import type MxPlugin from "@/mx-main";
import { mediaExtensions } from "@/patch/media-type";
import { MediaURL } from "@/web/url-match";

const avId = /^av(?<id>\d+)$/i;
/**
 * @see https://github.com/SocialSisterYi/bilibili-API-collect/tree/master?tab=readme-ov-file
 */
const bvId = /^BV1(?<id>[1-9A-HJ-NP-Za-km-z]{9})$/;

const youtubeId = /^[\w-]{11}$/;

export class MediaSwitcherModal extends SuggestModal<MediaURL> {
  constructor(public plugin: MxPlugin) {
    super(plugin.app);
    this.setPlaceholder("Enter URL or media ID");
    this.setInstructions([
      { command: "↑↓", purpose: "to navigate" },
      { command: "↵", purpose: "to open url" },
      {
        command: Platform.isMacOS ? "⌘ ↵" : "ctrl ↵",
        purpose: "to open in new tab",
      },
      {
        command: Platform.isMacOS ? "⌘ ⌥ ↵" : "ctrl alt ↵",
        purpose: "to open to the right",
      },
      { command: "esc", purpose: "to dismiss" },
    ]);
    // this.scope.register(["Mod"], "Enter", (e) => {
    //   this.selectSuggestion(null as any, e);
    //   return false;
    // });
    // this.scope.register(["Mod", "Alt"], "Enter", (e) => {
    //   this.selectSuggestion(null as any, e);
    //   return false;
    // });
    this.scope.register(null as any, "Enter", (e) => {
      // @ts-ignore
      this.chooser.useSelectedItem(e);
      return false;
    });
  }

  getSuggestions(query: string): MediaURL[] {
    const url = toURL(query);
    const guess: URL[] = [];
    if (!url) {
      let match;
      if ((match = query.match(avId))) {
        guess.push(
          new URL(`https://www.bilibili.com/video/av${match.groups!.id}`),
        );
      }
      if ((match = query.match(bvId))) {
        guess.push(new URL(`https://www.bilibili.com/video/${query}`));
      }
      if ((match = query.match(youtubeId))) {
        guess.push(new URL(`https://www.youtube.com/watch?v=${query}`));
      }
      if (!match) {
        const fixProtocol = toURL(`https://${query}`);
        if (fixProtocol) {
          guess.push(fixProtocol);
        }
      }
    }
    const guessInfo = guess
      .map((u) => MediaURL.create(u.href))
      .filter((x): x is MediaURL => !!x);
    const urlInfo = this.plugin.resolveUrl(url?.href);
    if (urlInfo) {
      return [urlInfo, ...guessInfo];
    }
    return guessInfo;
  }

  onNoSuggestion(): void {
    super.onNoSuggestion();
    // @ts-ignore
    this.chooser.setSuggestions([null]);
  }
  renderSuggestion(value: MediaURL | null, el: HTMLElement) {
    if (value) el.setText(value.href);
    else {
      el.setText("Open local file");
    }
  }
  async onChooseSuggestion(
    item: MediaURL | null,
    evt: MouseEvent | KeyboardEvent,
  ) {
    if (!item) {
      const mediaFile = await pickFile(mediaExtensions);
      if (!mediaFile) return;
      try {
        const url = pathToFileURL(mediaFile);
        item = new MediaURL(url.href);
      } catch (e) {
        console.error("Failed to generate file url", e, mediaFile);
        return;
      }
      if (!item.inferredType) {
        new Notice("Unsupported file type: " + mediaFile);
        return;
      }
    }
    if (Keymap.isModifier(evt, "Mod") && Keymap.isModifier(evt, "Alt")) {
      this.plugin.leafOpener.openMedia(item, "split", "vertical");
    } else if (Keymap.isModifier(evt, "Mod")) {
      this.plugin.leafOpener.openMedia(item, "tab");
    } else {
      this.plugin.leafOpener.openMedia(item);
    }
  }
}
