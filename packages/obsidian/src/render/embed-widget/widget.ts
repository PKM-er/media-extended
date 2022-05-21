import type { EditorView } from "@codemirror/view";
import { WidgetType } from "@codemirror/view";
import { parseSizeSyntax } from "@misc";
import { setMediaUrl, setObsidianMedia } from "@player";
import type MediaExtended from "@plugin";
import { PlayerRenderChild } from "@view";
import { vaildateMediaURL } from "mx-base";
import type { AppThunk } from "mx-store";
import { Platform, setIcon, TFile } from "obsidian";

type ElWithInfo<Media extends Record<string, any> = {}> = HTMLElement & {
  playerInfo?: {
    title: string;
    start: number;
    end: number;
    child: PlayerRenderChild;
  } & Media;
};

class InvaildMediaInfoError extends Error {
  constructor() {
    super("invalid media info");
  }
}

abstract class PlayerWidget<
  Media extends Record<string, any>,
> extends WidgetType {
  setPos(dom: HTMLElement) {
    let info = (dom as ElWithInfo).playerInfo;
    if (info) {
      info.start = this.start;
      info.end = this.end;
    }
  }
  hookClickHandler(view: EditorView, el: HTMLElement) {
    el.on("click", "div.edit-block-button", (evt) => {
      evt.defaultPrevented ||
        (this.selectElement(view, el), evt.preventDefault());
    });
  }
  addEditButton(view: EditorView, el: HTMLElement) {
    const button = el.createDiv("edit-block-button");
    setIcon(button, "edit");
    button.setAttr("aria-label", "Edit Source Markdown");
    button.addEventListener("click", () => {
      this.selectElement(view, el);
    });
  }
  selectElement(view: EditorView, el: HTMLElement) {
    const info = (el as ElWithInfo).playerInfo;
    let { start, end } = info ?? this;
    if (start < 0 || end < 0) {
      try {
        let pos = view.posAtDOM(el);
        view.dispatch({ selection: { head: pos, anchor: pos } });
        view.focus();
      } catch (e) {}
    } else {
      if (Platform.isMobile) end = start;
      try {
        view.dispatch({ selection: { head: start, anchor: end } });
        view.focus();
      } catch (e) {}
    }
  }
  resizeWidget(view: EditorView, el: HTMLElement) {
    window.ResizeObserver &&
      new window.ResizeObserver(() => {
        return view.requestMeasure();
      }).observe(el, { box: "border-box" });
  }

  constructor(
    public plugin: MediaExtended,
    public media: Media,
    public title: string,
    public start: number,
    public end: number,
  ) {
    super();
  }

  setInfo(dom: HTMLElement, child: PlayerRenderChild) {
    (dom as ElWithInfo<Media>).playerInfo = {
      title: this.title,
      start: this.start,
      end: this.end,
      child,
      ...this.media,
    };
  }

  abstract sameMedia(media: Media): boolean;
  abstract getSetMediaAction(): Promise<AppThunk<void, undefined> | null>;

  updateDOM(domToUpdate: HTMLElement): boolean {
    const info = (domToUpdate as ElWithInfo<Media>).playerInfo;
    if (!info) return false;
    const { title } = info;
    if (this.sameMedia(info)) {
      if (this.title !== title) {
        info.title = this.title;
        this.applyTitle(domToUpdate);
        this.setPos(domToUpdate);
      }
    } else {
      this.getSetMediaAction().then(
        (action) => action && info.child.store.dispatch(action),
      );
    }
    return true;
  }
  destroy(domToDestroy: HTMLElement): void {
    const info = (domToDestroy as ElWithInfo).playerInfo;
    if (info) {
      delete (domToDestroy as ElWithInfo).playerInfo;
      info.child.unload();
    }
  }
  eq(other: PlayerWidget<Media>): boolean {
    return this.sameMedia(other.media) && this.title === other.title;
  }

  abstract toDOM(view: EditorView): HTMLDivElement;

  setDOM(view: EditorView, container: HTMLDivElement) {
    container.tabIndex = -1;
    // container.setAttr("src", this.linktext);
    this.applyTitle(container);
    // container.addEventListener(
    //   "mousedown",
    //   (evt) => 0 === evt.button && view.hasFocus && evt.preventDefault(),
    // );
    this.getSetMediaAction()
      .then((action) => {
        if (!action) throw new InvaildMediaInfoError();
        const child = new PlayerRenderChild(
          action,
          this.plugin,
          container,
          true,
        );
        child.load();
        this.hookClickHandler(view, container);
        this.setInfo(container, child);
        this.resizeWidget(view, container);
      })
      .catch((reason) => {
        if (!(reason instanceof InvaildMediaInfoError))
          console.error("failed to get set media action: ", reason);
        container.setText("Failed to get media info");
        this.resizeWidget(view, container);
      });
  }
  private applyTitle(dom: HTMLElement) {
    if (!this.title) {
      dom.removeAttribute("alt");
      dom.style.removeProperty("width");
      dom.style.removeProperty("height");
      return;
    }
    const pipeLoc = this.title.lastIndexOf("|");
    let size,
      title = this.title;
    if (pipeLoc === -1) {
      size = parseSizeSyntax(this.title);
      if (size) title = "";
    } else {
      size = parseSizeSyntax(title.substring(pipeLoc + 1));
      if (size) title = title.substring(0, pipeLoc);
    }

    if (title) {
      dom.setAttr("alt", title);
    } else {
      dom.removeAttribute("alt");
    }
    const apply = (attr: "width" | "height", val: number) => {
      if (val < 0) dom.style.removeProperty(attr);
      else dom.style[attr] = `${val}px`;
    };
    if (size) {
      apply("width", size[0]);
      apply("height", size[1]);
    } else {
      apply("width", -1);
      apply("height", -1);
    }
  }
}
Object.defineProperty(PlayerWidget.prototype, "estimatedHeight", {
  get: () => 100,
  enumerable: false,
  configurable: true,
});

export class InternalEmbedWidget extends PlayerWidget<{
  linktext: string;
  file: TFile;
  hash: string;
}> {
  sameMedia(media: { linktext: string; file: TFile; hash: string }): boolean {
    return (
      this.media.file.path === media.file.path && this.media.hash === media.hash
    );
  }
  async getSetMediaAction() {
    return setObsidianMedia(this.media.file, this.media.hash, this.title);
  }
  toDOM(view: EditorView): HTMLDivElement {
    const container = createDiv({
      cls: ["internal-embed", "cm-embed-block", "mx-media-embed"],
      attr: { src: this.media.linktext },
    });
    this.setDOM(view, container);
    return container;
  }
}
export class ExternalEmbedWidget extends PlayerWidget<{
  src: string;
}> {
  sameMedia(media: { src: string }): boolean {
    return this.media.src === media.src;
  }
  async getSetMediaAction() {
    const { src } = this.media;
    if (src) {
      return setMediaUrl(src, this.title);
    } else return null;
  }
  toDOM(view: EditorView): HTMLDivElement {
    const container = createDiv();
    container.style.display = "none";
    vaildateMediaURL(this.media.src).then((vaild) => {
      container.setAttr("src", this.media.src);
      container.addClasses([
        "external-embed",
        "cm-embed-block",
        "mx-media-embed",
      ]);
      container.style.removeProperty("display");
      this.setDOM(view, container);
    });

    return container;
  }
}
