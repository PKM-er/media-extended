import { hookHTMLEvents } from "@hook-player/events/local-h5";
import { onStartH5 } from "@hook-player/on-start";
import { respondScreenshotReq } from "@hook-player/screenshot";
import { hookHTMLState } from "@hook-player/subc-state/local-h5";
import { respondTimestampReq } from "@hook-player/timestamp";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { PlayerStore, subscribe } from "@player/store";
import { HTMLMedia } from "@player/utils/media";
import { gotScreenshot, gotTimestamp } from "@slice/action/thunk";
import { selectAllowCORS, selectLoop } from "@slice/provider";
import { disableCORS } from "@slice/provider/thunk";
import { useUnmount } from "ahooks";
import React from "react";
import { useStore } from "react-redux";
import { useRefEffect } from "react-use-ref-effect";

import webmFix from "./webm-fix";

const hookStoreToHTMLPlayer = (
  player: HTMLMediaElement,
  store: PlayerStore,
) => {
  let media = new HTMLMedia(player);
  onStartH5(media, store);
  if (selectAllowCORS(store.getState())) {
    player.crossOrigin = "anonymous";
  }
  const toUnload = [
    hookHTMLEvents(player, store),
    hookHTMLState(media, store),
    webmFix(player, store),
    respondTimestampReq(new HTMLMedia(player), store, (...args) =>
      store.dispatch(gotTimestamp(...args)),
    ),
    respondScreenshotReq(player, store, (...args) =>
      store.dispatch(gotScreenshot(...args)),
    ),
    subscribe(
      store,
      selectAllowCORS,
      (allowCORS) => {
        if (allowCORS) {
          player.crossOrigin = "anonymous";
        } else {
          player.removeAttribute("crossOrigin");
        }
        player.load();
      },
      false,
    ),
  ];
  return () => toUnload.forEach((unload) => unload());
};

const HTMLPlayer = ({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) => {
  const source = useAppSelector((state) => state.provider.source),
    tracks = useAppSelector((state) => state.provider.tracks);

  const store = useStore() as PlayerStore;
  const ref = useRefEffect<HTMLMediaElement>(
    (player) => hookStoreToHTMLPlayer(player, store),
    [],
  );

  const props = {
    ref,
    style,
    className,
    loop: useAppSelector(selectLoop),
    // preload: "auto",
    autoPlay: useAppSelector((state) => state.controls.autoplay),
    controls: useAppSelector((state) => state.interface.controls === "native"),
  };

  const dispatch = useAppDispatch();

  let player;
  if (source) {
    const children = (
      <>
        <source src={source.src} onError={() => dispatch(disableCORS())} />
        {tracks.map((p) => (
          <track key={p.src} {...p} />
        ))}
      </>
    );
    if (source.playerType === "video" || source.playerType === "unknown") {
      player = <video {...props}>{children}</video>;
    } else if (source.playerType === "audio") {
      player = <audio {...props}>{children}</audio>;
    }
  }
  useUnmount(() => {
    for (const { src } of tracks) {
      if (src.startsWith("blob:")) {
        URL.revokeObjectURL(src);
      }
    }
  });
  return player ?? null;
};
export default HTMLPlayer;
