import { pathToFileURL } from "url";
import { assertNever } from "assert-never";
import { Keymap, Notice, Platform, SuggestModal } from "obsidian";
import { isFileMediaInfo, type MediaInfo } from "@/info/media-info";
import { checkMediaType } from "@/info/media-type";
import { MediaURL } from "@/info/media-url";
import path from "@/lib/path";
import { pickMediaFile } from "@/lib/picker";
import { toURL } from "@/lib/url";
import type MxPlugin from "@/mx-main";
import { getFsPromise } from "@/web/session/utils";
import { FileProtocolModal } from "./protocol-select";

const avId = /^av(?<id>\d+)$/i;
/**
 * @see https://github.com/SocialSisterYi/bilibili-API-collect/tree/master?tab=readme-ov-file
 */
const bvId = /^BV1(?<id>[1-9A-HJ-NP-Za-km-z]{9})$/;

const youtubeId = /^[\w-]{11}$/;

const hostnamePattern =
  /^(?:(?:[a-zA-Z\d]|[a-zA-Z\d][a-zA-Z\d-]*[a-zA-Z\d])\.)*(?:[A-Za-z\d]|[A-Za-z\d][A-Za-z\d-]*[A-Za-z\d])$/;

function toFileURL(path: string) {
  try {
    const url = pathToFileURL(path) as globalThis.URL;
    return url;
  } catch (e) {
    console.error(`Failed to convert path ${path} to URL: `, e);
    return null;
  }
}

function toURLGuess(query: string): URL | null {
  const url = path.isAbsolute(query) ? toFileURL(query) : toURL(query);
  if (!url) return null;
  if (
    ["http:", "https:"].includes(url.protocol) &&
    !hostnamePattern.test(url.hostname)
  ) {
    // invalid hostname
    return null;
  }
  return url;
}

export class MediaSwitcherModal extends SuggestModal<MediaInfo> {
  constructor(public plugin: MxPlugin) {
    super(plugin.app);
    this.inputEl.addEventListener("drop", (evt) => {
      if (!evt.dataTransfer) return;
      if (evt.dataTransfer.files.length === 0) return;
      const files = [...evt.dataTransfer.files];
      const mediaFiles = [...evt.dataTransfer.files].filter((f) =>
        checkMediaType(path.extname(f.name)),
      );
      if (mediaFiles.length === 0) {
        new Notice(
          `Cannot open dropped file${
            files.length > 1 ? "s" : ""
          }, not supported media file type`,
        );
        return;
      }
      const media = mediaFiles[0];
      evt.preventDefault();
      const target = evt.target as HTMLInputElement;
      target.value = media.path;
      target.dispatchEvent(new Event("input"));
    });
    this.setPlaceholder(
      "Enter file path, URL or media id, or drop a media file here",
    );
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

  getSuggestions(query: string): MediaInfo[] {
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
    value: MediaInfo | "file-picker" | "file-protocol-picker",
    el: HTMLElement,
  ) {
    if (value instanceof MediaURL) el.setText(decodeURI(value.href));
    else if (isFileMediaInfo(value)) el.setText(value.file.path);
    else if (value === "file-picker") {
      el.setText("Open local file");
    } else if (value === "file-protocol-picker") {
      el.setText("Pick from folders defined in custom protocol");
    } else {
      assertNever(value);
    }
  }
  async onChooseSuggestion(
    item: MediaInfo | "file-picker" | "file-protocol-picker",
    evt: MouseEvent | KeyboardEvent,
  ) {
    let mediaInfo: MediaInfo;
    if (item === "file-protocol-picker") {
      const fileProtocol = await FileProtocolModal.choose(this.plugin);
      if (!fileProtocol) return;
      const mediaFile = await pickMediaFile(fileProtocol.path);
      if (!mediaFile) return;
      if (!mediaFile.startsWith(fileProtocol.path)) {
        new Notice(
          `For protocol ${fileProtocol.action}, the file must be in ${fileProtocol.path}`,
        );
        return;
      }
      const url = toFileURL(mediaFile);
      if (!url) return;
      const resolved = this.plugin.resolveUrl(
        url.href.replace(
          fileProtocol.url.replace(/\/*$/, "/"),
          `mx://${fileProtocol.action}/`,
        ),
      );
      if (!resolved) {
        new Notice(
          `Failed to resolve file protocol url: ${url.href} with ${fileProtocol.url}`,
        );
        return;
      }
      mediaInfo = resolved;
    } else if (item === "file-picker") {
      const mediaFile = await pickMediaFile();
      if (!mediaFile) return;
      const url = toFileURL(mediaFile);
      if (!url) {
        new Notice("Failed to convert file path to URL: " + mediaFile);
        return;
      }
      const resolved = this.plugin.resolveUrl(url);
      if (!resolved) {
        new Notice("Failed to resolve file: " + mediaFile);
        return;
      }
      mediaInfo = resolved;
    } else {
      mediaInfo = item;
    }
    if (isFileMediaInfo(mediaInfo)) {
      // do nothing, already checked in resolveUrl
    } else if (mediaInfo.isFileUrl) {
      if (mediaInfo.hostname) {
        new Notice(
          `Network path is not supported in obsidian, you need to map it to a local path: ${
            mediaInfo.filePath ?? mediaInfo.readableHref
          }`,
        );
        return;
      }

      const fs = getFsPromise();
      if (!fs) {
        new Notice("File path is only supported in desktop app");
        return;
      }
      try {
        const s = await fs.stat(mediaInfo);
        if (!s.isFile()) {
          new Notice("Not a file: " + mediaInfo.readableHref);
          return;
        }
      } catch (e) {
        const err = e as NodeJS.ErrnoException;
        const filePath = mediaInfo.filePath ?? mediaInfo.href;
        if (err.code === "ENOENT") {
          new Notice("File not found: " + filePath);
        } else if (err.code === "EACCES") {
          new Notice("Permission denied: " + filePath);
        } else {
          new Notice(`Failed to access file (${err.code}): ` + filePath);
        }
        return;
      }
    }

    console.debug("media selected", mediaInfo);

    if (Keymap.isModifier(evt, "Mod") && Keymap.isModifier(evt, "Alt")) {
      this.plugin.leafOpener.openMedia(mediaInfo, "split", {
        direction: "vertical",
      });
    } else if (Keymap.isModifier(evt, "Mod")) {
      this.plugin.leafOpener.openMedia(mediaInfo, "tab");
    } else {
      this.plugin.leafOpener.openMedia(mediaInfo, false);
    }
  }
}
