/* eslint-disable @typescript-eslint/naming-convention */
import type { EditorView } from "@codemirror/view";
import { WidgetType } from "@codemirror/view";
import { Platform } from "obsidian";
import { dataLpPassthrough } from "@/components/player/buttons";
import { parseSizeSyntax } from "@/lib/size-syntax";
import { titleFromUrl } from "@/media-view/base";
import type { StateFacet } from "@/media-view/url-embed";
import { MediaRenderChild } from "@/media-view/url-embed";
import type MediaExtended from "@/mx-main";
import type { MediaURL } from "@/web/url-match";

class UrlMediaRenderChild extends MediaRenderChild {
  constructor(public containerEl: HTMLElement, public plugin: MediaExtended) {
    super(containerEl, plugin);
    containerEl.addClasses(["mx-external-media-embed"]);
    function isEditButton(target: EventTarget | null): boolean {
      if (!(target instanceof Element)) return false;
      const button = target.closest("button");
      if (!button) return false;
      return button.hasAttribute(dataLpPassthrough);
    }
    this.registerDomEvent(containerEl, "click", (evt) => {
      // only allow edit button to propagate to lp click handler
      if (!isEditButton(evt.target)) evt.stopImmediatePropagation();
    });
  }
}

type ElementWithInfo = HTMLElement & {
  playerInfo?: {
    title: string;
    start: number;
    end: number;
    child: UrlMediaRenderChild;
    url: MediaURL;
  };
};

abstract class UrlPlayerWidget extends WidgetType {
  setPos(dom: HTMLElement) {
    const info = (dom as ElementWithInfo).playerInfo;
    if (info) {
      info.start = this.start;
      info.end = this.end;
    }
  }
  hookClickHandler(view: EditorView, el: HTMLElement) {
    el.on("click", "button.mx-lp-edit", (evt) => {
      evt.defaultPrevented ||
        (this.selectElement(view, el), evt.preventDefault());
    });
  }
  selectElement(view: EditorView, el: HTMLElement) {
    const info = (el as ElementWithInfo).playerInfo;
    const { start } = info ?? this;
    let { end } = info ?? this;
    try {
      if (start < 0 || end < 0) {
        const pos = view.posAtDOM(el);
        view.dispatch({ selection: { head: pos, anchor: pos } });
        view.focus();
      } else {
        if (Platform.isMobile) end = start;
        view.dispatch({ selection: { head: start, anchor: end } });
        view.focus();
      }
    } catch (e) {
      // ignore
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
    public media: MediaURL,
    public title: string,
    public start: number,
    public end: number,
  ) {
    super();
  }

  setInfo(dom: HTMLElement, child: UrlMediaRenderChild) {
    (dom as ElementWithInfo).playerInfo = {
      title: this.title,
      start: this.start,
      end: this.end,
      child,
      url: this.media,
    };
  }

  updateDOM(domToUpdate: HTMLElement): boolean {
    const info = (domToUpdate as ElementWithInfo).playerInfo;
    if (!info) return false;
    const { title } = info;
    if (this.media.compare(info.url)) {
      if (this.title !== title) {
        info.title = this.title;
        this.applyTitle(domToUpdate);
        this.setPos(domToUpdate);
      }
    } else {
      info.child.update(this.toInfoFacet(this.media));
    }
    return true;
  }
  destroy(domToDestroy: HTMLElement): void {
    const info = (domToDestroy as ElementWithInfo).playerInfo;
    if (info) {
      delete (domToDestroy as ElementWithInfo).playerInfo;
      info.child.unload();
    }
  }
  eq(other: UrlPlayerWidget): boolean {
    return this.media.compare(other.media) && this.title === other.title;
  }

  abstract toInfoFacet(media: MediaURL): StateFacet;

  setDOM(view: EditorView, container: HTMLDivElement) {
    container.tabIndex = -1;
    // container.setAttr("src", this.linktext);
    this.applyTitle(container);
    // container.addEventListener(
    //   "mousedown",
    //   (evt) => 0 === evt.button && view.hasFocus && evt.preventDefault(),
    // );
    const child = new UrlMediaRenderChild(container, this.plugin);
    child.update(this.toInfoFacet(this.media));
    child.load();
    this.hookClickHandler(view, container);
    this.setInfo(container, child);
    this.resizeWidget(view, container);
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
  toDOM(view: EditorView): HTMLDivElement {
    const container = createDiv();
    container.style.display = "none";
    // vaildateMediaURL(this.media.src).then((vaild) => {
    container.setAttr("src", this.media.source.href);
    container.addClasses([
      "external-embed",
      "cm-embed-block",
      "mx-media-embed",
    ]);
    container.style.removeProperty("display");
    this.setDOM(view, container);
    // });

    return container;
  }
}
Object.defineProperty(UrlPlayerWidget.prototype, "estimatedHeight", {
  get: () => 100,
  enumerable: false,
  configurable: true,
});

function toInfoFacet(media: MediaURL, enableWebview: boolean): StateFacet {
  return {
    hash: media.hash,
    source: media,
    enableWebview,
    title: titleFromUrl(media.source.href),
  };
}

export class VideoUrlPlayerWidget extends UrlPlayerWidget {
  toInfoFacet(media: MediaURL) {
    return toInfoFacet(media, false);
  }
}
export class AudioUrlPlayerWidget extends UrlPlayerWidget {
  toInfoFacet(media: MediaURL) {
    return toInfoFacet(media, false);
  }
}
export class IframePlayerWidget extends UrlPlayerWidget {
  toInfoFacet(media: MediaURL) {
    return toInfoFacet(media, false);
  }
}

export class WebpagePlayerWidget extends UrlPlayerWidget {
  toInfoFacet(media: MediaURL) {
    return toInfoFacet(media, true);
  }
}

export const WidgetCtorMap = {
  "mx-url-audio": AudioUrlPlayerWidget,
  "mx-url-video": VideoUrlPlayerWidget,
  "mx-embed": IframePlayerWidget,
  "mx-webpage": WebpagePlayerWidget,
} satisfies Record<string, typeof UrlPlayerWidget>;
