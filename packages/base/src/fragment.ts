import { isTimestamp } from "./temporal-frag";

type Frag = readonly [number, number] | null;

const handleTimeFrag = (frag: Frag, duration: number | null): Frag => {
  if (!frag) return null;
  let [start, end] = frag;

  // if only start is set, treat it as timestamp
  // don't restrict play range
  if (isTimestamp(frag)) return null;

  if (start < 0) start = 0;
  else if (duration && duration < start) return null;
  if (end < 0) end = Infinity;
  return [start, end];
};

type Media = Pick<
  import("./media-warpper").Media,
  "currentTime" | "seekTo" | "duration" | "pause" | "paused" | "play"
>;

export const onFragUpdate = (frag: Frag, media: Media) => {
  if (!media || !frag) return;
  const [start, end] = frag;
  if (isTimestamp(frag) || media.currentTime < start || media.currentTime > end)
    media.seekTo(start);
};

export const onTimeUpdate = async (frag: Frag, media: Media, loop: boolean) => {
  frag = handleTimeFrag(frag, media.duration);
  if (!frag) return;
  const [start, end] = frag;
  if (media.currentTime > end) {
    if (!loop) {
      media.pause();
    } else {
      media.seekTo(start);
      // continue to play in loop
      // if temporal fragment (#t=,2 at the end of src) paused the media
      if (media.paused) await media.play();
    }
  } else if (media.currentTime < start) {
    media.seekTo(start);
  }
};

export const onPlay = (frag: Frag, media: Media) => {
  frag = handleTimeFrag(frag, media.duration);
  if (!frag) return;
  const [start, end] = frag;
  // time range
  if (media.currentTime > end || media.currentTime < start) {
    media.seekTo(start);
  }
};
