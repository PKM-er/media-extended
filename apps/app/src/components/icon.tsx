import { setIcon } from "obsidian";
import { useCallback, useRef } from "react";

function useIconRef(icon: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (node: HTMLDivElement) => {
      if (ref.current) {
        // Make sure to cleanup any events/references added to the last instance
        ref.current.empty();
      }

      if (node) {
        // Check if a node is actually passed. Otherwise node would be null.
        // You can now do what you need to, addEventListeners, measure, etc.
        setIcon(node, icon);
      }

      // Save a reference to the node
      ref.current = node;
    },
    [icon],
  );

  return [setRef] as const;
}

function makeIcon(icon: string) {
  return function Icon(props: React.ComponentPropsWithoutRef<"div">) {
    const [ref] = useIconRef(icon);
    return <div ref={ref} {...props} />;
  };
}

export const PlayIcon = makeIcon("play"),
  PauseIcon = makeIcon("pause"),
  Volume0Icon = makeIcon("volume"),
  VolumeLowIcon = makeIcon("volume-1"),
  VolumeHighIcon = makeIcon("volume-2"),
  MuteIcon = makeIcon("volume-x"),
  FullscreenIcon = makeIcon("maximize"),
  FullscreenExitIcon = makeIcon("minimize"),
  PictureInPictureIcon = makeIcon("picture-in-picture-2"),
  PictureInPictureExitIcon = makeIcon("picture-in-picture"),
  SubtitlesIcon = makeIcon("subtitles"),
  CheckCircleIcon = makeIcon("check-circle"),
  CircleIcon = makeIcon("circle"),
  FastForwardIcon = makeIcon("fast-forward"),
  RewindIcon = makeIcon("rewind"),
  EditIcon = makeIcon("edit"),
  ImageDownIcon = makeIcon("image-down"),
  PinIcon = makeIcon("pin"),
  MoreIcon = makeIcon("more-horizontal");
