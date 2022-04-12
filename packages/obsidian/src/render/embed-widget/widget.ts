import type { EditorView } from "@codemirror/view";
import { WidgetType } from "@codemirror/view";
import { parseSizeSyntax } from "@misc";
import type MediaExtended from "@plugin";
import { getFileHashFromLinktext, setObsidianMedia } from "@slice/set-media";
import { MediaView, PlayerRenderChild } from "@view";
import cls from "classnames";
import { Platform, setIcon } from "obsidian";
import ReactDOM from "react-dom";
abstract class LPWidget extends WidgetType {}

type ElWithInfo = HTMLElement & {
  playerInfo?: {
    linktext: string;
    sourcePath: string;
    title: string;
    start: number;
    end: number;
    child: PlayerRenderChild;
  };
};

export default class InternalPlayerWidget extends WidgetType {
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
    public linktext: string,
    public sourcePath: string,
    public title: string,
    public start: number,
    public end: number,
  ) {
    super();
  }

  setInfo(dom: HTMLElement, child: PlayerRenderChild) {
    (dom as ElWithInfo).playerInfo = {
      linktext: this.linktext,
      sourcePath: this.sourcePath,
      title: this.title,
      start: this.start,
      end: this.end,
      child,
    };
  }

  updateDOM(domToUpdate: HTMLElement) {
    const info = (domToUpdate as ElWithInfo).playerInfo;
    if (!info) return false;
    const { linktext, sourcePath, title } = info;
    if (this.linktext === linktext && this.sourcePath === sourcePath) {
      if (this.title !== title) {
        info.title = this.title;
        this.applyTitle(domToUpdate);
        this.setPos(domToUpdate);
      }
    } else {
      const action = this.getSetMediaAction();
      action && info.child.store.dispatch(action);
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
  eq(other: InternalPlayerWidget): boolean {
    return (
      this.linktext === other.linktext &&
      this.sourcePath === other.sourcePath &&
      this.title === other.title
    );
  }

  getSetMediaAction() {
    const result = getFileHashFromLinktext(this.linktext, this.sourcePath);
    if (result) {
      return setObsidianMedia(...result, this.title);
    } else return null;
  }
  toDOM(view: EditorView) {
    const container = createDiv("internal-embed cm-embed-block");
    container.tabIndex = -1;
    container.setAttr("src", this.linktext);
    this.applyTitle(container);
    // container.addEventListener(
    //   "mousedown",
    //   (evt) => 0 === evt.button && view.hasFocus && evt.preventDefault(),
    // );
    const action = this.getSetMediaAction();
    if (action) {
      const child = MediaView.displayInEl(action, this.plugin, container, true);
      child.load();
      this.hookClickHandler(view, container);
      this.setInfo(container, child);
    } else {
      container.setText("Failed to get media info");
    }
    this.resizeWidget(view, container);

    return container;
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
Object.defineProperty(InternalPlayerWidget.prototype, "estimatedHeight", {
  get: () => 100,
  enumerable: false,
  configurable: true,
});
