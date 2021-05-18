import MediaExtended from "main";
import { MarkdownPostProcessorContext, parseLinktext } from "obsidian";

export abstract class Handler<T extends HTMLElement> {
  target: T;
  plugin?: MediaExtended;
  ctx?: MarkdownPostProcessorContext;

  constructor(
    target: T,
    plugin?: MediaExtended,
    ctx?: MarkdownPostProcessorContext,
  ) {
    this.target = target;
    this.plugin = plugin;
    this.ctx = ctx;
  }

  setTarget(target: T): this {
    this.target = target;
    return this;
  }

  /** raw link */
  public abstract get linktext(): string;

  /** link without hash */
  public get link(): string {
    return parseLinktext(this.linktext).path;
  }
  public get hash(): string {
    return parseLinktext(this.linktext).subpath;
  }

  protected replaceWith(newEl: HTMLElement) {
    if (this.target.parentNode) {
      this.target.parentNode.replaceChild(newEl, this.target);
    } else {
      console.error(this.target);
      throw new Error("parentNode of img not found");
    }
  }
}
