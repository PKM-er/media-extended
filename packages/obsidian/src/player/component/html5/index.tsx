import hookStoreToHTMLPlayer from "@hook-player";
import { useAppSelector } from "@player/hooks";
import { PlayerStore } from "@player/store";
import { HTMLMedia } from "@player/utils/media";
import { gotScreenshot, gotTimestamp } from "@slice/action/thunk";
import React from "react";
import { useStore } from "react-redux";
import { useRefEffect } from "react-use-ref-effect";

import { respondScreenshotReq } from "../hook-player/screenshot";
import { respondTimestampReq } from "../hook-player/timestamp";
import webmFix from "./webm-fix";

const HTMLPlayer = ({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) => {
  const source = useAppSelector((state) => state.provider.source),
    tracks = useAppSelector((state) => state.provider.tracks);

  const autoPlay = useAppSelector((state) => state.controls.autoplay),
    loop = useAppSelector((state) => state.controls.loop),
    controls = useAppSelector((state) => state.interface.controls === "native");

  const store = useStore() as PlayerStore;
  const ref = useRefEffect<HTMLMediaElement>((player) => {
    const toUnload = [
      hookStoreToHTMLPlayer(player, store),
      webmFix(player, store),
      respondTimestampReq(new HTMLMedia(player), store, (...args) =>
        store.dispatch(gotTimestamp(...args)),
      ),
      respondScreenshotReq(player, store, (...args) =>
        store.dispatch(gotScreenshot(...args)),
      ),
    ];
    return () => toUnload.forEach((unload) => unload());
  }, []);

  const props = {
    ref,
    style,
    className,
    loop,
    // preload: "auto",
    autoPlay,
    controls,
  };
  let player;
  if (source) {
    const children = (
      <>
        <source src={source.src} />
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
  return player ?? null;
};
export default HTMLPlayer;
