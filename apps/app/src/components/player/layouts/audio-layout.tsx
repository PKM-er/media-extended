import * as Tooltip from "@radix-ui/react-tooltip";
import { Controls, Gesture } from "@vidstack/react";

import * as Buttons from "../buttons";
import * as Menus from "../menus";
import * as Sliders from "../sliders";
import { TimeGroup } from "../time-group";
import { Title } from "../title";

export interface VideoLayoutProps {
  thumbnails?: string;
}

export function AudioLayout({ thumbnails }: VideoLayoutProps) {
  return (
    <>
      <Gestures />
      <Controls.Root className="opacity-100 absolute inset-0 z-10 flex h-full w-full flex-col bg-gradient-to-t from-black/10 to-transparent">
        <Tooltip.Provider>
          <div className="flex-1" />
          <Controls.Group className="flex w-full items-center px-2">
            <Sliders.Time thumbnails={thumbnails} />
          </Controls.Group>
          <Controls.Group className="-mt-0.5 flex w-full items-center px-2 pb-2">
            <Buttons.Rewind seconds={30} />
            <Buttons.Play />
            <Buttons.FastForward seconds={30} />
            <Buttons.Mute />
            <Sliders.Volume />
            <TimeGroup />
            <Title />
            <div className="flex-1" />
            <Buttons.EditorEdit />
            <Menus.MoreOptions />
          </Controls.Group>
        </Tooltip.Provider>
      </Controls.Root>
    </>
  );
}

function Gestures() {
  return (
    <>
      <Gesture
        className="absolute inset-0 z-0 block h-full w-full"
        event="pointerup"
        action="toggle:paused"
      />
      <Gesture
        className="absolute inset-0 z-0 block h-full w-full"
        event="dblpointerup"
        action="toggle:fullscreen"
      />
      <Gesture
        className="absolute left-0 top-0 z-10 block h-full w-1/5"
        event="dblpointerup"
        action="seek:-10"
      />
      <Gesture
        className="absolute right-0 top-0 z-10 block h-full w-1/5"
        event="dblpointerup"
        action="seek:10"
      />
    </>
  );
}
