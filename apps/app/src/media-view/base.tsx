import type { Component } from "obsidian";
import type ReactDOM from "react-dom/client";
import { type MediaViewStoreApi } from "@/components/context";
import type MediaExtended from "@/mx-main";

export interface PlayerComponent extends Component {
  plugin: MediaExtended;
  store: MediaViewStoreApi;
  root: ReactDOM.Root | null;
}
