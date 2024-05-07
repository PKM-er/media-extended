import { useCaptionOptions, useMediaState } from "@vidstack/react";
import { SubtitlesIcon } from "@/components/icon";
import { toTrackLabel, useLastSelectedTrack } from "../use-tracks";
import { dataLpPassthrough } from "./buttons";
import { useMenu } from "./menus";

export function Captions() {
  const options = useCaptionOptions();
  const tracks = useMediaState("textTracks");
  const [, cacheSelectedTrack] = useLastSelectedTrack();
  const onClick = useMenu((menu) => {
    options.forEach(({ label, select, selected, track }, i) => {
      menu.addItem((item) => {
        item
          .setTitle(track ? toTrackLabel(track, i) : label)
          .setChecked(selected)
          .onClick(() => {
            select();
            console.log("cacheSelectedTrack", track?.id ?? null, track?.mode);
            cacheSelectedTrack(track?.id ?? null);
          });
      });
    });
    return true;
  });

  if (tracks.length === 0) return null;

  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      {...{ [dataLpPassthrough]: true }}
      onClick={onClick}
      aria-label="Select Caption"
    >
      <SubtitlesIcon className="w-7 h-7" />
    </button>
  );
}
