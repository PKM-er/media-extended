import { pathToFileURL } from "url";
import { assertNever } from "assert-never";
import { Keymap, Notice, Platform, SuggestModal } from "obsidian";
import { pickFile } from "@/lib/picker";
import { toURL } from "@/lib/url";
import type MxPlugin from "@/mx-main";
import { MediaFileExtensions, mediaExtensions } from "@/patch/media-type";
import { getDialog } from "@/web/session/utils";
import { MediaURL } from "@/web/url-match";
import { FileProtocolModal } from "./protocol-select";

const avId = /^av(?<id>\d+)$/i;
/**
 * @see https://github.com/SocialSisterYi/bilibili-API-collect/tree/master?tab=readme-ov-file
 */
const bvId = /^BV1(?<id>[1-9A-HJ-NP-Za-km-z]{9})$/;

const youtubeId = /^[\w-]{11}$/;

const hostnamePattern =
  /^(?:(?:[a-zA-Z\d]|[a-zA-Z\d][a-zA-Z\d-]*[a-zA-Z\d])\.)*(?:[A-Za-z\d]|[A-Za-z\d][A-Za-z\d-]*[A-Za-z\d])$/;

function toURLGuess(query: string): URL | null {
  // simple check if absolute path
  if (
    (Platform.isWin && query.match(/^[a-zA-Z]+:[\\/]/)) ||
    query.startsWith("/")
  ) {
    try {
      return pathToFileURL(query) as globalThis.URL;
    } catch {
      // ignore
    }
  }
  const url = toURL(query);
  if (!url) return null;
  const { hostname } = url;
  // valid hostname
  if (!hostnamePattern.test(hostname)) return null;
  return url;
}

export class MediaSwitcherModal extends SuggestModal<MediaURL> {
  constructor(public plugin: MxPlugin) {
    super(plugin.app);
    this.setPlaceholder("Enter file path, URL or media ID");
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
    const url = toURLGuess(query);
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
        const fixProtocol = toURLGuess(`https://${query}`);
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
    this.chooser.setSuggestions(["file-picker", "file-protocol-picker"]);
  }
  renderSuggestion(
    value: MediaURL | "file-picker" | "file-protocol-picker",
    el: HTMLElement,
  ) {
    if (value instanceof MediaURL) el.setText(decodeURI(value.href));
    else if (value === "file-picker") {
      el.setText("Open local file");
    } else if (value === "file-protocol-picker") {
      el.setText("Pick from folders defined in custom protocol");
    } else {
      assertNever(value);
    }
  }
  async onChooseSuggestion(
    item: MediaURL | "file-picker" | "file-protocol-picker",
    evt: MouseEvent | KeyboardEvent,
  ) {
    if (item === "file-protocol-picker") {
      const fileProtocol = await FileProtocolModal.choose(this.plugin);
      if (!fileProtocol) return;
      const file = (
        await getDialog().showOpenDialog({
          title: "Pick a media file",
          message: "Pick a media file to open",
          buttonLabel: "Pick",
          properties: ["openFile"],
          filters: [
            { extensions: MediaFileExtensions.video, name: "Video" },
            { extensions: MediaFileExtensions.audio, name: "Audio" },
          ],
          defaultPath: fileProtocol.path,
        })
      ).filePaths[0];
      if (!file?.startsWith(fileProtocol.path)) {
        new Notice("File outside of protocol path: " + fileProtocol.path);
        return;
      }
      try {
        const url = pathToFileURL(file);
        const resolved = this.plugin.resolveUrl(
          url.href.replace(
            fileProtocol.url.replace(/\/*$/, "/"),
            `mx://${fileProtocol.action}/`,
          ),
        );
        if (!resolved) {
          new Notice("Failed to resolve file protocol url: " + url.href);
          return;
        }
        item = resolved;
      } catch (e) {
        console.error("Failed to generate file protocol url", e, file);
        return;
      }
    } else if (item === "file-picker") {
      const mediaFile = await pickFile(mediaExtensions);
      if (!mediaFile) return;
      try {
        const url = pathToFileURL(mediaFile);
        item = new MediaURL(url.href);
      } catch (e) {
        console.error("Failed to generate file url", e, mediaFile);
        return;
      }
    } else if (item instanceof MediaURL) {
      // do nothing
    } else {
      assertNever(item);
    }
    if (item.isFileUrl && !item.inferredType) {
      new Notice("Unsupported file type: " + item.pathname);
      return;
    }

    if (Keymap.isModifier(evt, "Mod") && Keymap.isModifier(evt, "Alt")) {
      this.plugin.leafOpener.openMedia(item, "split", {
        direction: "vertical",
        noRemap: true,
      });
    } else if (Keymap.isModifier(evt, "Mod")) {
      this.plugin.leafOpener.openMedia(item, "tab", { noRemap: true });
    } else {
      this.plugin.leafOpener.openMedia(item, false, { noRemap: true });
    }
  }
}
