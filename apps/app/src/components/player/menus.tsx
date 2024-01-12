import { useCaptionOptions, useMediaState } from "@vidstack/react";
import { Menu } from "obsidian";
import { SubtitlesIcon } from "@/components/icon";

export function Captions() {
  const options = useCaptionOptions();
  const tracks = useMediaState("textTracks");

  if (tracks.length === 0) return null;

  return (
    <button
      className="group ring-mod-border-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 focus-visible:ring-2 aria-disabled:hidden"
      onClick={(evt) => {
        const menu = new Menu();
        // menu.addItem((item) =>
        //   item.setIsLabel(true).setTitle("Caption " + hint),
        // );
        options.forEach(({ label, select, selected }) => {
          menu.addItem((item) =>
            item.setTitle(label).setChecked(selected).onClick(select),
          );
        });
        menu.showAtMouseEvent(evt.nativeEvent);
      }}
      aria-label="Select Caption"
    >
      <SubtitlesIcon className="w-7 h-7" />
    </button>
  );
}
