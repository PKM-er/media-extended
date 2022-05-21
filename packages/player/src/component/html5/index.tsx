import { IActions, PlayerContext } from "@context";
import { hookHTMLEvents } from "@hook-player/events/local-h5";
import { onStartH5 } from "@hook-player/on-start";
import { respondScreenshotReq } from "@hook-player/screenshot";
import { hookHTMLState } from "@hook-player/subc-state/local-h5";
import { respondTimestampReq } from "@hook-player/timestamp";
import { useAppDispatch, useAppSelector } from "@store-hooks";
import { HTMLMedia } from "@utils/media";
import { useUnmount } from "ahooks";
import { disableCORS } from "mx-store";
import {
  PlayerStore,
  selectAllowCORS,
  selectAutoplay,
  selectHTMLPlayerType,
  selectHTMLSrc,
  selectIsNativeControls,
  selectLoop,
  selectTracks,
  subscribe,
} from "mx-store";
import { PlayerType } from "mx-store";
import React, { useContext } from "react";
import { useStore } from "react-redux";
import { useRefEffect } from "react-use-ref-effect";

import webmFix from "./webm-fix";

const hookStoreToHTMLPlayer = (
  player: HTMLMediaElement,
  store: PlayerStore,
  { gotTimestamp, gotScreenshot }: IActions,
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
      gotTimestamp(store.dispatch, args),
    ),
    respondScreenshotReq(player, store, (...args) =>
      gotScreenshot(store.dispatch, args),
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
  const store = useStore() as PlayerStore;
  const { actions } = useContext(PlayerContext);
  const ref = useRefEffect<HTMLMediaElement>(
    (player) => hookStoreToHTMLPlayer(player, store, actions),
    [],
  );

  const props = {
    ref,
    style,
    className,
    loop: useAppSelector(selectLoop),
    // preload: "auto",
    autoPlay: useAppSelector(selectAutoplay),
    controls: useAppSelector(selectIsNativeControls),
  };

  const dispatch = useAppDispatch();

  const src = useAppSelector(selectHTMLSrc),
    tracks = useAppSelector(selectTracks),
    type = useAppSelector(selectHTMLPlayerType);

  let player;
  if (src && type) {
    const children = (
      <>
        <source src={src} onError={() => dispatch(disableCORS())} />
        {tracks?.map((p) => (
          <track key={p.src} {...p} />
        ))}
      </>
    );
    if (type === PlayerType.video) {
      player = <video {...props}>{children}</video>;
    } else {
      player = <audio {...props}>{children}</audio>;
    }
  }
  useUnmount(() => {
    tracks?.forEach(
      ({ src }) => src.startsWith("blob:") && URL.revokeObjectURL(src),
    );
  });
  return player ?? null;
};
export default HTMLPlayer;
