import { PlayerRenderChild } from "../media-view-v2";

export type ElementWithRenderChild = HTMLElement & {
  renderChild?: PlayerRenderChild;
};
