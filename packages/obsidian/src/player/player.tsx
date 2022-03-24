import assertNever from "assert-never";
import { parseTF } from "mx-lib";
import { EventRef } from "obsidian";
import React, {
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/compat";
import { parse as parseQS } from "query-string";

import { InternalMediaInfo } from "../base/media-info";
import { MediaType } from "../base/media-type";
import PlayerControls from "./controls";
import { is, useFrag, useHashProps } from "./hash-tool";
import { ControlsContext, PlayerContext } from "./misc";
import H5MediaProvider from "./provider/html5";
import { useIcon } from "./utils";

export const enum ShowControls {
  none,
  native,
  full,
}
interface PlayerProps {
  info: InternalMediaInfo;
  controls?: ShowControls;
  onFocus?: (evt: FocusEvent) => any;
  onBlur?: (evt: FocusEvent) => any;
}

const Player = ({
  info,
  controls = ShowControls.full,
  onFocus,
  onBlur,
}: PlayerProps) => {
  const playerRef = useRef<HTMLMediaElement>(null);

  const [mediaInfo, setMediaInfo] = useState(info);

  const { events, inEditor } = useContext(PlayerContext);
  useEffect(() => {
    let refs: EventRef[] = [];
    if (events) {
      if (playerRef.current) {
        events.trigger("player-init", playerRef.current);
      } else {
        events.trigger("player-destroy");
      }
      refs.push(
        events.on("file-loaded", (info) => {
          setMediaInfo(info);
        }),
      );
    }
    return () => {
      events && refs.forEach(events.offref.bind(events));
    };
  }, [events]);

  const timeSpan = useMemo(() => parseTF(mediaInfo.hash), [mediaInfo.hash]);
  const hashQuery = useMemo(() => parseQS(mediaInfo.hash), [mediaInfo.hash]);
  const controlsEnabled = useMemo(() => is(hashQuery, "controls"), [hashQuery]);

  useFrag(timeSpan, playerRef);
  useHashProps(hashQuery, playerRef);
  if (controls === ShowControls.none && controlsEnabled) {
    controls = ShowControls.full;
  }

  const editBtn = useIcon(["pencil"]);
  const src = useMemo(() => mediaInfo.resourcePath, [mediaInfo.src]);
  return (
    <>
      <div className="provider">
        <H5MediaProvider
          type={mediaInfo.type}
          ref={playerRef}
          src={src}
          controls={controls === ShowControls.native}
        />
      </div>
      <div className="media-ui" onFocus={onFocus} onBlur={onBlur}>
        {controls === ShowControls.full && (
          <ControlsContext.Provider value={{ timeSpan, player: playerRef }}>
            <PlayerControls />
          </ControlsContext.Provider>
        )}
      </div>
      {inEditor && (
        <div
          aria-label="Edit Source Markdown"
          className="edit-block-button"
          role="button"
          ref={editBtn}
        />
      )}
    </>
  );
};
export default Player;
