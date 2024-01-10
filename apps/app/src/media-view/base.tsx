import type { Component } from "obsidian";
import type ReactDOM from "react-dom/client";
import { type MediaViewStoreApi } from "@/components/context";
import { isTimestamp, parseTempFrag } from "@/lib/hash/temporal-frag";
import type MediaExtended from "@/mx-main";

export interface PlayerComponent extends Component {
  plugin: MediaExtended;
  store: MediaViewStoreApi;
  root: ReactDOM.Root | null;
}

export function setTempFrag(hash: string, store: MediaViewStoreApi) {
  store.setState({ hash });
  const tf = parseTempFrag(hash);
  const player = store.getState().player;
  if (player && tf && isTimestamp(tf)) {
    player.currentTime = tf.start;
  }
}
