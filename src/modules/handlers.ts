import MediaExtended from "main";
import { MarkdownPostProcessorContext, parseLinktext } from "obsidian";

export abstract class Handler<T extends HTMLElement> {
  target: T;

  constructor(target: T) {
    this.target = target;
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
