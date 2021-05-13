import { getPlayer } from "./videoHostTools";

type mediaType = "audio" | "video";
const acceptedExt: Map<mediaType, string[]> = new Map([
  ["audio", ["mp3", "wav", "m4a", "ogg", "3gp", "flac"]],
  ["video", ["mp4", "webm", "ogv"]],
]);
export class ExternalEmbedHandler {
  target: HTMLImageElement;
  constructor(target?: HTMLImageElement) {
    if (target) this.target = target;
    else this.target = createEl("img");
  }

  setTarget(target: HTMLImageElement): this {
    this.target = target;
    return this;
  }

  public get src(): string {
    return this.target.src;
  }

  public get srcUrl(): URL | null {
    try {
      return new URL(this.src);
    } catch (error) {
      // if url is invaild, do nothing and break current loop
      return null;
    }
  }

  private replaceWith(newEl: HTMLElement) {
    if (this.target.parentNode) {
      this.target.parentNode.replaceChild(newEl, this.target);
    } else {
      console.error(this.target);
      throw new Error("parentNode of img not found");
    }
  }

  doDirectLink(): this | null {
    const url = this.srcUrl;
    if (!url) return this;

    // if url contains no extension, type = null
    let fileType: mediaType | null = null;
    if (url.pathname.includes(".")) {
      const ext = url.pathname.split(".").pop() as string;
      for (const [type, extList] of acceptedExt) {
        if (extList.includes(ext)) fileType = type;
      }
    }

    if (fileType) {
      let newEl = createEl(fileType);
      newEl.src = this.src;
      newEl.controls = true;
      this.replaceWith(newEl);
      return null;
    } else return this;
  }

  doVideoHost(): this | null {
    const url = this.srcUrl;
    if (!url) return this;

    const newEl = getPlayer(url);
    if (newEl) {
      this.replaceWith(newEl);
      return null;
    } else return this;
  }
}
