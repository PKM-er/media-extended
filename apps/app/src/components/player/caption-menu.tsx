import type { CaptionOption } from "@vidstack/react";
import { useCaptionOptions, useMediaState } from "@vidstack/react";
import { SubtitlesIcon } from "@/components/icon";
import { dataLpPassthrough } from "./buttons";
import { useMenu } from "./menus";

function sortCaption(a: CaptionOption, b: CaptionOption) {
  if (a.track && b.track) {
    // if with item.track.language, sort by item.track.language
    if (a.track.language && b.track.language) {
      return (a.track as { language: string }).language.localeCompare(
        (b.track as { language: string }).language,
      );
    }

    // if not with item.track.language, sort by item.label
    if (!a.track.language && !b.track.language) {
      return a.label.localeCompare(b.label);
    }

    // if one has language and the other doesn't, the one with language comes first
    if (a.track.language && !b.track.language) {
      return -1;
    }
    if (!a.track.language && b.track.language) {
      return 1;
    }
  }
  // if item.track is null, put it at the end
  if (a.track === null && b.track !== null) {
    return 1;
  }
  if (a.track !== null && b.track === null) {
    return -1;
  }
  return 0;
}
export function Captions() {
  const options = useCaptionOptions();
  const tracks = useMediaState("textTracks");
  const onClick = useMenu((menu) => {
    options
      .sort(sortCaption)
      .forEach(({ label, select, selected }, idx, options) => {
        menu.addItem((item) => {
          if (options.length === 2 && label === "Unknown") {
            label = "On";
          }
          item.setTitle(label).setChecked(selected).onClick(select);
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
